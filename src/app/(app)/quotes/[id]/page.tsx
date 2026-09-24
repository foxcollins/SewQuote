import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button, Card, PageHeader, SectionTitle, inputClass } from "@/components/ui/primitives";
import { formatMoney, formatDate, type Locale } from "@/lib/i18n";
import { overrideFinalPriceAction } from "@/modules/quotes/actions";
import { QuoteLifecycleActions } from "@/modules/quotes/quote-lifecycle-actions";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  accepted: "Aprobado",
  rejected: "Rechazado",
  expired: "Vencido",
  cancelled: "Cancelado",
};

const COMPLEXITY_LABEL: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  very_high: "Muy alta",
};

const URGENCY_LABEL: Record<string, string> = {
  normal: "Normal",
  urgent: "Urgente",
  very_urgent: "Muy urgente",
};

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
      clients(id, name, phone, whatsapp),
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
  const client = (quote.clients ?? {}) as {
    name?: string;
    phone?: string | null;
    whatsapp?: string | null;
  };
  const totalLabel = formatMoney(
    quote.final_price != null ? Number(quote.final_price) : price,
    quote.currency ?? ctx.currency,
    locale,
  );

  return (
    <main className="pb-8">
      <PageHeader
        title={`#${String(quote.quote_number).padStart(3, "0")}`}
        subtitle={`${client.name ?? ""} · v${quote.version_number} · ${tLabel(quote.status)}${quote.valid_until ? ` · ${formatDate(quote.valid_until, locale)}` : ""}`}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge
              status={quote.status}
              label={STATUS_LABEL[quote.status] ?? quote.status}
            />
            <span className="metric rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-sm font-semibold text-[var(--primary)] sm:hidden">
              {totalLabel}
            </span>
          </div>
        }
      />

      {(pastDue || quote.status === "expired") && (
        <p className="mb-4 rounded-[6px] border border-[var(--warning)]/40 bg-[var(--warning-bg)] px-3 py-2 text-xs text-[var(--warning)]">
          Este presupuesto está vencido. Los precios pueden haber cambiado.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px] lg:gap-6 xl:grid-cols-[1fr_380px]">
        <aside className="min-w-0 space-y-4 lg:order-2 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4">
            <SectionTitle>Cálculo transparente</SectionTitle>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="min-w-0 text-[var(--ink-muted)]">Materiales</dt>
                <dd className="metric shrink-0">{money(Number(quote.subtotal_materials))}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="min-w-0 text-[var(--ink-muted)]">Mano de obra</dt>
                <dd className="metric shrink-0">{money(Number(quote.subtotal_labor))}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="min-w-0 text-[var(--ink-muted)]">Complejidad</dt>
                <dd className="metric shrink-0">{money(Number(quote.complexity_amount))}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="min-w-0 text-[var(--ink-muted)]">Urgencia</dt>
                <dd className="metric shrink-0">{money(Number(quote.urgency_amount))}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="min-w-0 text-[var(--ink-muted)]">Otros</dt>
                <dd className="metric shrink-0">{money(Number(quote.other_costs_amount))}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="min-w-0 text-[var(--ink-muted)]">Margen</dt>
                <dd className="metric shrink-0">{money(Number(quote.margin_amount))}</dd>
              </div>
              <div className="mt-2 flex justify-between gap-3 border-t border-[var(--border)] pt-2 font-semibold">
                <dt className="min-w-0">Sugerido</dt>
                <dd className="metric shrink-0">{money(Number(quote.suggested_price))}</dd>
              </div>
              <div className="mt-1 rounded-[6px] bg-[var(--surface-2)] px-3 py-3">
                <div className="flex items-end justify-between gap-3">
                  <dt className="text-xs font-semibold tracking-wide text-[var(--ink-muted)] uppercase">
                    Final
                  </dt>
                  <dd className="metric text-xl font-semibold text-[var(--primary)] sm:text-2xl">
                    {money(
                      quote.final_price != null ? Number(quote.final_price) : price,
                    )}
                  </dd>
                </div>
              </div>
            </dl>
            {quote.override_reason && (
              <p className="mt-2 text-xs text-[var(--ink-muted)] break-words">
                Override: {quote.override_reason}
              </p>
            )}
            {(quote.status === "draft" || quote.status === "sent") && (
              <form
                action={overrideFinalPriceAction.bind(null, quote.id)}
                className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  name="final_price"
                  type="number"
                  step="0.01"
                  placeholder="Precio final"
                  className={`${inputClass} h-10`}
                />
                <input
                  name="override_reason"
                  placeholder="Motivo"
                  className={`${inputClass} h-10`}
                />
                <Button type="submit" variant="secondary" size="sm" className="sm:h-10">
                  OK
                </Button>
              </form>
            )}
          </Card>

          <Card className="p-4">
            <SectionTitle>Acciones</SectionTitle>
            <QuoteLifecycleActions
              quoteId={quote.id}
              status={quote.status}
              quoteNumber={quote.quote_number}
              clientName={client.name ?? null}
              totalLabel={totalLabel}
              whatsapp={client.whatsapp ?? null}
              phone={client.phone ?? null}
              publicHref={
                publicHref && quote.public_token
                  ? `/orcamento/${quote.public_token}`
                  : null
              }
            />
            {workOrder && (
              <Link
                href={`/works/${workOrder.id}` as Route}
                className="mt-2 flex h-12 items-center justify-center rounded-[6px] bg-[var(--primary)] text-center text-sm font-semibold text-[var(--on-primary)] transition-colors hover:bg-[var(--primary-hover)]"
              >
                Ver orden de trabajo
              </Link>
            )}
          </Card>
        </aside>

        <div className="min-w-0 space-y-4 lg:order-1">
          <section className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_1px_2px_rgba(28,29,31,0.04)] sm:p-4">
            <SectionTitle>Trabajos / piezas ({jobs.length})</SectionTitle>
            <div className="space-y-3">
              {jobs.map((job, i) => (
                <article
                  key={job.id}
                  className="border-b border-[var(--border)] pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold break-words">
                        {job.garment_type || `Pieza ${i + 1}`}
                      </p>
                      <p className="text-xs text-[var(--ink-muted)] break-words">
                        {job.job_categories?.name ?? ""}
                        {job.persons?.name ? ` · ${job.persons.name}` : ""}
                      </p>
                      {job.garment_description && (
                        <p className="mt-1 text-xs text-[var(--ink-muted)] break-words">
                          {job.garment_description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                      <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ink-muted)] uppercase">
                        {COMPLEXITY_LABEL[job.complexity] ?? job.complexity}
                      </span>
                      <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ink-muted)] uppercase">
                        {URGENCY_LABEL[job.urgency] ?? job.urgency}
                      </span>
                    </div>
                  </div>

                  {(job.labor_method === "fixed" ||
                    (job.estimated_minutes ?? 0) > 0) && (
                    <p className="mt-2 text-xs text-[var(--ink-muted)]">
                      Mano de obra:{" "}
                      {job.labor_method === "fixed" && job.labor_fixed_price != null
                        ? `fijo ${money(Number(job.labor_fixed_price))}`
                        : `${job.estimated_minutes ?? 0} min estimados`}
                    </p>
                  )}

                  {job.quote_items.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs">
                      {job.quote_items.map((it) => (
                        <li key={it.id} className="flex justify-between gap-3">
                          <span className="min-w-0 break-words">
                            {it.description_snapshot} × {it.quantity}
                          </span>
                          <span className="metric shrink-0">{money(Number(it.total))}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {job.quote_materials.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs">
                      {job.quote_materials.map((m) => (
                        <li key={m.id} className="flex justify-between gap-3">
                          <span className="min-w-0 break-words">
                            {m.material_name_snapshot} {m.quantity} {m.unit_snapshot}{" "}
                            <span className="text-[var(--ink-muted)]">
                              (merma {m.waste_percent}%)
                            </span>
                          </span>
                          <span className="metric shrink-0">{money(Number(m.total))}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {job.measurements_snapshot?.values?.length ? (
                    <details className="mt-3" open>
                      <summary className="cursor-pointer text-xs font-semibold text-[var(--primary)]">
                        Medidas congeladas
                        {job.measurements_snapshot.recorded_at
                          ? ` · ${formatDate(job.measurements_snapshot.recorded_at, locale)}`
                          : ""}
                      </summary>
                      <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        {job.measurements_snapshot.values.map((v, idx) => (
                          <div
                            key={idx}
                            className="rounded-[4px] bg-[var(--surface-2)] px-2 py-1"
                          >
                            <dt className="text-[10px] tracking-wide text-[var(--ink-muted)] uppercase break-words">
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
                    <p className="mt-2 text-xs text-[var(--ink-muted)] break-words">
                      {job.notes}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>

          {quote.notes && (
            <p className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink-muted)] break-words">
              Notas: {quote.notes}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function tLabel(status: string) {
  return STATUS_LABEL[status] ?? status;
}
