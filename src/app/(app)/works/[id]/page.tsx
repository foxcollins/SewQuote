import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney, formatDate, type Locale } from "@/lib/i18n";
import {
  transitionWorkOrderAction,
  updateWorkOrderMetaAction,
} from "@/modules/works/actions";

const WORK_LABEL: Record<string, string> = {
  accepted: "Aceptado",
  waiting_garment: "Esperando prenda",
  in_production: "En producción",
  fitting: "Prueba",
  adjustments: "Ajustes",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const TRANSITIONS: Record<string, string[]> = {
  accepted: ["waiting_garment", "in_production", "cancelled"],
  waiting_garment: ["in_production", "cancelled"],
  in_production: ["fitting", "adjustments", "ready", "cancelled"],
  fitting: ["adjustments", "ready", "in_production", "cancelled"],
  adjustments: ["fitting", "ready", "in_production", "cancelled"],
  ready: ["delivered", "adjustments"],
  delivered: [],
  cancelled: [],
};

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");
  const { id } = await params;
  const locale = (ctx.locale as Locale) || "es";
  const supabase = await createClient();

  const { data: work } = await supabase
    .from("work_orders")
    .select(
      `*,
       quotes(
         id, quote_number, suggested_price, final_price, status, currency,
         clients(id, name),
         quote_jobs(garment_type, garment_description, measurements_snapshot)
       )`,
    )
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .single();
  if (!work) notFound();

  const quote = Array.isArray(work.quotes) ? work.quotes[0] : work.quotes;
  const jobs = (quote?.quote_jobs ?? []) as {
    garment_type: string | null;
    garment_description: string | null;
    measurements_snapshot: {
      values?: { name: string; value: number; unit: string }[];
    } | null;
  }[];
  const nexts = TRANSITIONS[work.status] ?? [];
  const terminal = work.status === "delivered" || work.status === "cancelled";
  const money = (n: number) => formatMoney(n, quote?.currency ?? ctx.currency, locale);

  return (
    <main className="mx-auto max-w-lg p-4 pb-24">
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-[var(--ink-muted)]">
            {(quote?.clients as { name?: string } | null)?.name ?? ""} ·{" "}
            <Link
              href={`/quotes/${quote?.id}` as Route}
              className="text-[var(--primary)]"
            >
              #{String(quote?.quote_number ?? 0).padStart(3, "0")}
            </Link>
          </p>
          <h1 className="text-2xl font-semibold">Orden de trabajo</h1>
          <p className="text-xs text-[var(--ink-muted)]">
            v{work.quote_version_number} ·{" "}
            {money(Number(work.actual_price ?? 0))}
          </p>
        </div>
        <StatusBadge
          status={work.status}
          label={WORK_LABEL[work.status] ?? work.status}
        />
      </header>

      <section className="mb-4 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-4 text-xs text-[var(--ink-muted)]">
        <p>Creado: {formatDate(work.created_at, locale, ctx.timezone)}</p>
        {work.started_at && <p>Iniciado: {formatDate(work.started_at, locale)}</p>}
        {work.completed_at && (
          <p>Completado: {formatDate(work.completed_at, locale)}</p>
        )}
      </section>

      <section className="mb-4 space-y-2">
        <h2 className="text-sm font-semibold">Piezas</h2>
        {jobs.map((j, i) => (
          <article
            key={i}
            className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-3"
          >
            <p className="text-sm font-semibold">
              {j.garment_type || `Pieza ${i + 1}`}
            </p>
            {j.garment_description && (
              <p className="text-xs text-[var(--ink-muted)]">
                {j.garment_description}
              </p>
            )}
            {j.measurements_snapshot?.values?.length ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-semibold text-[var(--primary)]">
                  Medidas del presupuesto
                </summary>
                <dl className="mt-2 grid grid-cols-3 gap-2">
                  {j.measurements_snapshot.values.map((v, idx) => (
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
          </article>
        ))}
      </section>

      {!terminal && (
        <section className="mb-4 space-y-2">
          <h2 className="text-sm font-semibold">Siguiente estado</h2>
          {nexts.map((s) => (
            <form key={s} action={transitionWorkOrderAction.bind(null, work.id, s)}>
              <button
                type="submit"
                className={`h-11 w-full rounded-[6px] text-sm font-semibold ${
                  s === "cancelled"
                    ? "border border-[var(--error)] text-[var(--error)]"
                    : "bg-[var(--primary)] text-[var(--on-primary)]"
                }`}
              >
                {WORK_LABEL[s] ?? s}
              </button>
            </form>
          ))}
        </section>
      )}

      {!terminal && (
        <section className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold">Editar trabajo</h2>
          <form action={updateWorkOrderMetaAction.bind(null, work.id)} className="space-y-3">
            <label className="block text-sm font-semibold">
              Minutos reales
              <input
                name="actual_minutes"
                type="number"
                defaultValue={work.actual_minutes ?? ""}
                className="mt-1 h-11 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold">
              Precio final cobrado
              <input
                name="actual_price"
                type="number"
                step="0.01"
                defaultValue={work.actual_price ?? ""}
                className="mt-1 h-11 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold">
              Notas
              <textarea
                name="notes"
                rows={3}
                defaultValue={work.notes ?? ""}
                className="mt-1 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="h-11 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold"
            >
              Guardar
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
