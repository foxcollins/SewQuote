import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney, formatDate, type Locale } from "@/lib/i18n";
import {
  acceptQuoteAction,
  cancelQuoteAction,
  expireQuoteAction,
  overrideFinalPriceAction,
  recalculateQuoteAfterExpiryAction,
  rejectQuoteAction,
  sendQuoteAction,
} from "@/modules/quotes/actions";
import { convertQuoteToWorkOrderAction } from "@/modules/works/actions";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  accepted: "Aprobado",
  rejected: "Rechazado",
  expired: "Vencido",
  cancelled: "Cancelado",
};

function Btn({
  action,
  children,
  tone = "primary",
  disabled,
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  tone?: "primary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const cls =
    tone === "primary"
      ? "bg-[var(--primary)] text-[var(--on-primary)]"
      : tone === "danger"
        ? "border border-[var(--error)] text-[var(--error)]"
        : "border border-[var(--border)] bg-[var(--surface)]";
  return (
    <form action={action}>
      <button
        type="submit"
        disabled={disabled}
        className={`h-11 w-full rounded-[6px] text-sm font-semibold ${cls} disabled:opacity-50`}
      >
        {children}
      </button>
    </form>
  );
}

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");
  const { id } = await params;
  const locale = (ctx.locale as Locale) || "es";
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select(
      `*,
      clients(id, name),
      quote_jobs(
        id, garment_type, garment_description, labor_method, labor_fixed_price,
        estimated_minutes, complexity, urgency, measurements_snapshot, notes, sort_order,
        job_categories(name),
        persons(name),
        quote_items(id, description_snapshot, quantity, unit_price_snapshot, total),
        quote_materials(id, material_name_snapshot, quantity, unit_snapshot, unit_price_snapshot, waste_percent, total)
      ),
      work_orders(id)`,
    )
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .single();
  if (!quote) notFound();

  const jobs = (quote.quote_jobs ?? []) as {
    id: string;
    garment_type: string | null;
    garment_description: string | null;
    labor_method: string;
    labor_fixed_price: number | null;
    estimated_minutes: number | null;
    complexity: string;
    urgency: string;
    measurements_snapshot: {
      label?: string;
      recorded_at?: string;
      values?: { name: string; value: number; unit: string }[];
    } | null;
    notes: string | null;
    sort_order: number;
    job_categories?: { name: string } | null;
    persons?: { name: string } | null;
    quote_items: {
      id: string;
      description_snapshot: string;
      quantity: number;
      unit_price_snapshot: number;
      total: number;
    }[];
    quote_materials: {
      id: string;
      material_name_snapshot: string;
      quantity: number;
      unit_snapshot: string;
      unit_price_snapshot: number;
      waste_percent: number;
      total: number;
    }[];
  }[];
  jobs.sort((a, b) => a.sort_order - b.sort_order);

  const workOrder = (quote.work_orders as { id: string }[] | null)?.[0];
  const money = (n: number) => formatMoney(n, quote.currency ?? ctx.currency, locale);
  const price = Number(quote.final_price ?? quote.suggested_price ?? 0);
  const today = new Date().toISOString().slice(0, 10);
  const pastDue =
    quote.status === "sent" && quote.valid_until && quote.valid_until < today;
  const publicHref = quote.public_token
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/orcamento/${quote.public_token}`
    : null;

  return (
    <main className="mx-auto max-w-lg p-4 pb-24">
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-[var(--ink-muted)]">
            {(quote.clients as { name?: string } | null)?.name ?? ""}
          </p>
          <h1 className="text-2xl font-semibold">
            #{String(quote.quote_number).padStart(3, "0")}
          </h1>
          <p className="text-xs text-[var(--ink-muted)]">
            v{quote.version_number} · {tLabel(quote.status)}
            {quote.valid_until
              ? ` · ${formatDate(quote.valid_until, locale)}`
              : ""}
          </p>
        </div>
        <StatusBadge status={quote.status} label={STATUS_LABEL[quote.status] ?? quote.status} />
      </header>

      {(pastDue || quote.status === "expired") && (
        <p className="mb-4 rounded-[6px] bg-[var(--warning-bg)] px-3 py-2 text-xs text-[var(--warning)]">
          Este presupuesto está vencido. Los precios pueden haber cambiado.
        </p>
      )}

      <section className="mb-4 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>Materiales</dt>
            <dd className="metric">{money(Number(quote.subtotal_materials))}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Mano de obra</dt>
            <dd className="metric">{money(Number(quote.subtotal_labor))}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Complejidad</dt>
            <dd className="metric">{money(Number(quote.complexity_amount))}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Urgencia</dt>
            <dd className="metric">{money(Number(quote.urgency_amount))}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Otros</dt>
            <dd className="metric">{money(Number(quote.other_costs_amount))}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Margen</dt>
            <dd className="metric">{money(Number(quote.margin_amount))}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-[var(--border)] pt-2 font-semibold">
            <dt>Sugerido</dt>
            <dd className="metric">{money(Number(quote.suggested_price))}</dd>
          </div>
          <div className="flex justify-between text-[var(--primary)]">
            <dt>Final</dt>
            <dd className="metric font-semibold">
              {money(
                quote.final_price != null ? Number(quote.final_price) : price,
              )}
            </dd>
          </div>
        </dl>
        {quote.override_reason && (
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            Override: {quote.override_reason}
          </p>
        )}
        {(quote.status === "draft" || quote.status === "sent") && (
          <form
            action={overrideFinalPriceAction.bind(null, quote.id)}
            className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2"
          >
            <input
              name="final_price"
              type="number"
              step="0.01"
              placeholder="Precio final"
              className="h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
            />
            <input
              name="override_reason"
              placeholder="Motivo"
              className="h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
            />
            <button
              type="submit"
              className="h-10 rounded-[6px] border border-[var(--border)] px-3 text-xs font-semibold"
            >
              OK
            </button>
          </form>
        )}
      </section>

      <section className="mb-4 space-y-3">
        <h2 className="text-sm font-semibold">Trabajos / piezas</h2>
        {jobs.map((job, i) => (
          <article
            key={job.id}
            className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {job.garment_type || `Pieza ${i + 1}`}
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {job.job_categories?.name ?? ""}
                  {job.persons?.name ? ` · ${job.persons.name}` : ""}
                </p>
              </div>
              <span className="text-[11px] uppercase text-[var(--ink-muted)]">
                {job.complexity} / {job.urgency}
              </span>
            </div>

            {job.quote_items.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs">
                {job.quote_items.map((it) => (
                  <li key={it.id} className="flex justify-between gap-2">
                    <span>
                      {it.description_snapshot} × {it.quantity}
                    </span>
                    <span className="metric">{money(Number(it.total))}</span>
                  </li>
                ))}
              </ul>
            )}

            {job.quote_materials.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs">
                {job.quote_materials.map((m) => (
                  <li key={m.id} className="flex justify-between gap-2">
                    <span>
                      {m.material_name_snapshot} {m.quantity} {m.unit_snapshot}{" "}
                      <span className="text-[var(--ink-muted)]">
                        (merma {m.waste_percent}%)
                      </span>
                    </span>
                    <span className="metric">{money(Number(m.total))}</span>
                  </li>
                ))}
              </ul>
            )}

            {job.measurements_snapshot?.values?.length ? (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-[var(--primary)]">
                  Medidas congeladas
                </summary>
                <dl className="mt-2 grid grid-cols-3 gap-2">
                  {job.measurements_snapshot.values.map((v, idx) => (
                    <div key={idx} className="rounded-[4px] bg-[var(--surface-2)] px-2 py-1">
                      <dt className="text-[10px] uppercase text-[var(--ink-muted)]">
                        {v.name}
                      </dt>
                      <dd className="metric text-sm font-semibold">
                        {v.value} {v.unit}
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
            ) : null}

            {job.notes && (
              <p className="mt-2 text-xs text-[var(--ink-muted)]">{job.notes}</p>
            )}
          </article>
        ))}
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-sm font-semibold">Acciones</h2>

        {quote.status === "draft" && (
          <>
            <Btn action={() => sendQuoteAction(quote.id)}>Enviar / publicar</Btn>
            <Btn action={() => cancelQuoteAction(quote.id)} tone="danger">
              Cancelar
            </Btn>
          </>
        )}

        {quote.status === "sent" && (
          <>
            <Btn action={() => acceptQuoteAction(quote.id)}>Aprobar (interna)</Btn>
            <Btn action={() => rejectQuoteAction(quote.id)} tone="danger">
              Rechazar
            </Btn>
            <Btn action={() => expireQuoteAction(quote.id)} tone="ghost">
              Marcar vencido
            </Btn>
            <Btn action={() => cancelQuoteAction(quote.id)} tone="danger">
              Cancelar
            </Btn>
            {publicHref && (
              <Link
                href={`/orcamento/${quote.public_token}` as Route}
                className="flex h-11 items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold"
              >
                Abrir página pública
              </Link>
            )}
          </>
        )}

        {quote.status === "expired" && (
          <Btn action={() => recalculateQuoteAfterExpiryAction(quote.id)}>
            Recalcular y reenviar
          </Btn>
        )}

        {quote.status === "accepted" && !workOrder && (
          <Btn action={() => convertQuoteToWorkOrderAction(quote.id)}>
            Convertir en orden de trabajo
          </Btn>
        )}

        {workOrder && (
          <Link
            href={`/works/${workOrder.id}` as Route}
            className="flex h-11 items-center justify-center rounded-[6px] bg-[var(--primary)] text-sm font-semibold text-[var(--on-primary)]"
          >
            Ver orden de trabajo
          </Link>
        )}
      </section>

      {quote.notes && (
        <p className="text-xs text-[var(--ink-muted)]">Notas: {quote.notes}</p>
      )}
    </main>
  );
}

function tLabel(status: string) {
  return STATUS_LABEL[status] ?? status;
}
