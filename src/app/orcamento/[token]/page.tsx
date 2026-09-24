import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate, defaultLocale, type Locale } from "@/lib/i18n";
import { PublicQuoteActions } from "@/modules/public/public-quote-actions";

export const dynamic = "force-dynamic";

type PublicQuotePayload = {
  quote: {
    id: string;
    quote_number: number;
    status: string;
    currency: string;
    subtotal_materials: number;
    subtotal_labor: number;
    complexity_amount: number;
    urgency_amount: number;
    other_costs_amount: number;
    margin_amount: number;
    suggested_price: number;
    final_price: number | null;
    valid_until: string | null;
    version_number: number;
  };
  client: { name: string };
  tenant: { name: string; currency: string; locale: string };
  jobs: {
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
    job_category: { name: string } | null;
    person: { name: string } | null;
    items: {
      description_snapshot: string;
      quantity: number;
      total: number;
    }[] | null;
    materials: {
      material_name_snapshot: string;
      quantity: number;
      unit_snapshot: string;
      waste_percent: number;
      total: number;
    }[] | null;
  }[];
  comments: { id: string; body: string; author_name: string | null; created_at: string }[];
  versions: {
    version_number: number;
    reason: string;
    suggested_price: number | null;
    final_price: number | null;
    created_at: string;
  }[];
};

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 8) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_quote", {
    p_token: token,
  });
  if (error || !data) notFound();

  const payload = data as PublicQuotePayload;
  const { quote, client, tenant, jobs, comments, versions } = payload;

  const locale = (tenant?.locale as Locale) || defaultLocale;
  const currency = quote.currency || tenant?.currency || "BRL";
  const money = (n: number) => formatMoney(n, currency, locale);

  const today = new Date().toISOString().slice(0, 10);
  const pastDue =
    quote.valid_until && quote.valid_until < today && quote.status === "sent";
  const displayStatus = pastDue ? "expired" : quote.status;
  const canAct = quote.status === "sent" && !pastDue;
  const price = Number(quote.final_price ?? quote.suggested_price ?? 0);

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-[var(--canvas)] p-4 pb-32 lg:p-8">
      <header className="mb-6 border-b border-[var(--border)] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold text-[var(--primary)]">
              {tenant?.name ?? "SewQuote"}
            </p>
            <h1 className="display mt-2 text-3xl">
              Presupuesto #{String(quote.quote_number).padStart(3, "0")}
            </h1>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {client?.name ?? ""}
              {quote.valid_until
                ? ` · Válido hasta ${formatDate(quote.valid_until, locale)}`
                : ""}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-[var(--ink-muted)]">
              Estado:{" "}
              <strong
                className={
                  displayStatus === "accepted"
                    ? "text-[var(--success)]"
                    : displayStatus === "rejected" || displayStatus === "expired"
                      ? "text-[var(--error)]"
                      : ""
                }
              >
                {displayStatus === "sent"
                  ? "Enviado"
                  : displayStatus === "accepted"
                    ? "Aprobado"
                    : displayStatus === "rejected"
                      ? "Rechazado"
                      : displayStatus === "expired"
                        ? "Vencido"
                        : displayStatus}
              </strong>
            </p>
          </div>
          <p className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink-muted)]">
            Portal de aprobación · solo lectura
          </p>
        </div>
      </header>

      {displayStatus === "expired" && quote.status === "sent" && (
        <p className="mb-4 rounded-[6px] bg-[var(--warning-bg)] px-3 py-2 text-xs text-[var(--warning)]">
          Este presupuesto está vencido — no se puede aprobar.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              Trabajos incluidos
            </h2>
        <div className="space-y-4">
          {jobs.map((job, i) => (
            <article
              key={job.id}
              className="border-b border-[var(--border)] pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {job.garment_type || `Pieza ${i + 1}`}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {job.job_category?.name ?? ""}
                    {job.person?.name ? ` · ${job.person.name}` : ""}
                  </p>
                </div>
                <span className="text-[11px] uppercase text-[var(--ink-muted)]">
                  {job.urgency}
                </span>
              </div>

              {job.items && job.items.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">
                  {job.items.map((it, idx) => (
                    <li key={idx} className="flex justify-between gap-2">
                      <span>
                        {it.description_snapshot} × {it.quantity}
                      </span>
                      <span className="metric">{money(Number(it.total))}</span>
                    </li>
                  ))}
                </ul>
              )}

              {job.materials && job.materials.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">
                  {job.materials.map((m, idx) => (
                    <li key={idx} className="flex justify-between gap-2">
                      <span>
                        {m.material_name_snapshot} {m.quantity} {m.unit_snapshot}
                      </span>
                      <span className="metric">{money(Number(m.total))}</span>
                    </li>
                  ))}
                </ul>
              )}

              {job.measurements_snapshot?.values?.length ? (
                <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {job.measurements_snapshot.values.map((v, idx) => (
                    <div
                      key={idx}
                      className="rounded-[4px] bg-[var(--surface-2)] px-2 py-1"
                    >
                      <dt className="text-[10px] uppercase text-[var(--ink-muted)]">
                        {v.name}
                      </dt>
                      <dd className="metric text-sm font-semibold">
                        {v.value} {v.unit}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="mb-3 text-sm font-semibold">Historial de versiones</h2>
        {versions.length > 0 ? (
          <ul className="space-y-1 text-xs text-[var(--ink-muted)]">
            {versions.map((v) => (
              <li key={v.version_number} className="flex justify-between">
                <span>
                  v{v.version_number} · {v.reason}
                </span>
                <span className="metric">
                  {money(Number(v.final_price ?? v.suggested_price ?? 0))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[var(--ink-muted)]">Sin versiones previas.</p>
        )}
      </section>

      {comments.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">Comentarios</h2>
          <ul className="space-y-2">
            {comments.map((c) => (
              <li
                key={c.id}
                className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
              >
                <p className="text-xs text-[var(--ink-muted)]">
                  {c.author_name ?? "Cliente"} · {formatDate(c.created_at, locale)}
                </p>
                <p className="mt-1">{c.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="mb-1 text-sm font-semibold">Resumen económico</h2>
            <p className="mb-3 text-xs text-[var(--ink-muted)]">
              Sin cargos ocultos ni tarifas imprevistas.
            </p>
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
                <dt>Complejidad + urgencia</dt>
                <dd className="metric">
                  {money(
                    Number(quote.complexity_amount) + Number(quote.urgency_amount),
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Otros</dt>
                <dd className="metric">{money(Number(quote.other_costs_amount))}</dd>
              </div>
              <div className="mt-3 rounded-[6px] bg-[var(--surface-2)] px-3 py-3">
                <div className="flex items-end justify-between gap-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                    Total
                  </dt>
                  <dd className="metric text-2xl font-semibold text-[var(--primary)]">
                    {money(price)}
                  </dd>
                </div>
              </div>
            </dl>
            <p className="mt-2 text-[11px] text-[var(--ink-muted)]">
              Los materiales están congelados en este presupuesto.
            </p>
          </section>

          <PublicQuoteActions token={token} canAct={canAct} status={quote.status} />
        </aside>
      </div>

      <footer className="mt-8 text-center text-[11px] text-[var(--ink-muted)]">
        SewQuote · Presupuesto #{String(quote.quote_number).padStart(3, "0")}
      </footer>
    </main>
  );
}
