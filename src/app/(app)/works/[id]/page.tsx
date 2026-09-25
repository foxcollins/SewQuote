import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button, Card, PageHeader, SectionTitle, inputClass } from "@/components/ui/primitives";
import { formatMoney, formatDate, formatMeasurement, measurementFieldLabel, statusLabel, t } from "@/lib/i18n";
import { WorkLifecycleActions } from "@/modules/works/work-lifecycle-actions";
import { updateWorkOrderMetaAction } from "@/modules/works/actions";
import { WORK_TRANSITIONS, isTerminalWorkStatus } from "@/modules/work-transitions";

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");
  const { id } = await params;
  const locale = ctx.locale;
  const supabase = await createClient();

  const { data: work } = await supabase
    .from("work_orders")
    .select(
      `*,
       quotes(
         id, quote_number, suggested_price, final_price, status, currency,
         clients(id, name),
         quote_jobs(garment_type, garment_description, measurements_snapshot)
       ),
       work_order_items(
         id, status, measurements_snapshot, sort_order, notes,
         quote_jobs(garment_type, garment_description)
       )`,
    )
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .single();
  if (!work) notFound();

  const quote = Array.isArray(work.quotes) ? work.quotes[0] : work.quotes;
  const items = (
    (work.work_order_items as {
      id: string;
      status: string;
      measurements_snapshot: {
        values?: { name: string; value: number; unit: string }[];
      } | null;
      sort_order: number | null;
      notes: string | null;
      quote_jobs: {
        garment_type: string | null;
        garment_description: string | null;
      } | null;
    }[] | null) ?? []
  ).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const legacyJobs = (quote?.quote_jobs ?? []) as {
    garment_type: string | null;
    garment_description: string | null;
    measurements_snapshot: {
      values?: { name: string; value: number; unit: string }[];
    } | null;
  }[];
  const pieces = items.length
    ? items.map((it, i) => ({
        key: it.id,
        title:
          it.quote_jobs?.garment_type ||
          t(locale, "works.detail.piece_fallback", { number: i + 1 }),
        description: it.quote_jobs?.garment_description,
        measurements: it.measurements_snapshot,
        status: it.status,
        notes: it.notes,
      }))
    : legacyJobs.map((j, i) => ({
        key: `legacy-${i}`,
        title:
          j.garment_type || t(locale, "works.detail.piece_fallback", { number: i + 1 }),
        description: j.garment_description,
        measurements: j.measurements_snapshot,
        status: work.status,
        notes: null as string | null,
      }));
  const nexts = WORK_TRANSITIONS[work.status] ?? [];
  const terminal = isTerminalWorkStatus(work.status);
  const money = (n: number) => formatMoney(n, quote?.currency ?? ctx.currency, locale);

  return (
    <main className="mx-auto max-w-3xl pb-8">
      <PageHeader
        title={t(locale, "works.detail.title")}
        subtitle={`${(quote?.clients as { name?: string } | null)?.name ?? ""} · ${money(Number(work.actual_price ?? 0))} · v${work.quote_version_number}`}
        action={
          <StatusBadge
            status={work.status}
            label={statusLabel(locale, "work", work.status)}
          />
        }
      />

      <Card className="mb-4 p-4 text-xs text-[var(--ink-muted)]">
        <p>
          {t(locale, "works.detail.created", {
            date: formatDate(work.created_at, locale, ctx.timezone),
          })}
        </p>
        {work.started_at && (
          <p>
            {t(locale, "works.detail.started", {
              date: formatDate(work.started_at, locale, ctx.timezone),
            })}
          </p>
        )}
        {work.completed_at && (
          <p>
            {t(locale, "works.detail.completed", {
              date: formatDate(work.completed_at, locale, ctx.timezone),
            })}
          </p>
        )}
        <p className="mt-1">
          <Link href={`/quotes/${quote?.id}` as Route} className="text-[var(--primary)]">
            {t(locale, "works.detail.view_quote", {
              number: String(quote?.quote_number ?? 0).padStart(3, "0"),
            })}
          </Link>
        </p>
      </Card>

      <section className="mb-4 space-y-2">
        <SectionTitle>
          {t(locale, "works.detail.pieces_title", { count: pieces.length })}
        </SectionTitle>
        {pieces.map((p) => (
          <article
            key={p.key}
            className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_1px_2px_rgba(28,29,31,0.04)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold break-words">{p.title}</p>
                {p.description && (
                  <p className="text-xs text-[var(--ink-muted)] break-words">
                    {p.description}
                  </p>
                )}
              </div>
              <StatusBadge
                status={p.status}
                label={statusLabel(locale, "work", p.status)}
              />
            </div>
            {p.notes && (
              <p className="mt-1 text-xs text-[var(--ink-muted)] break-words">
                {p.notes}
              </p>
            )}
            {p.measurements?.values?.length ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-semibold text-[var(--primary)]">
                  {t(locale, "works.detail.frozen_measurements")}
                </summary>
                <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {p.measurements.values.map((v, idx) => (
                    <div key={idx} className="rounded-[4px] bg-[var(--surface-2)] px-2 py-1">
                      <dt className="text-[10px] uppercase text-[var(--ink-muted)] break-words">
                        {measurementFieldLabel(locale, v.name)}
                      </dt>
                      <dd className="metric text-sm font-semibold">
                        {formatMeasurement(v.value, v.unit, locale)}
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
        <section className="mb-4">
          <SectionTitle>{t(locale, "works.detail.next_state")}</SectionTitle>
          <WorkLifecycleActions workId={work.id} nexts={nexts} />
        </section>
      )}

      {!terminal && (
        <Card className="p-4">
          <SectionTitle>{t(locale, "works.detail.edit")}</SectionTitle>
          <form action={updateWorkOrderMetaAction.bind(null, work.id)} className="space-y-3">
            <label className="block text-sm font-semibold">
              {t(locale, "works.detail.actual_minutes")}
              <input
                name="actual_minutes"
                type="number"
                defaultValue={work.actual_minutes ?? ""}
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="block text-sm font-semibold">
              {t(locale, "works.detail.actual_price")}
              <input
                name="actual_price"
                type="number"
                step="0.01"
                defaultValue={work.actual_price ?? ""}
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="block text-sm font-semibold">
              {t(locale, "works.detail.notes")}
              <textarea
                name="notes"
                rows={3}
                defaultValue={work.notes ?? ""}
                className="mt-1 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none"
              />
            </label>
            <Button type="submit" variant="secondary" className="w-full">
              {t(locale, "common.save")}
            </Button>
          </form>
        </Card>
      )}
    </main>
  );
}
