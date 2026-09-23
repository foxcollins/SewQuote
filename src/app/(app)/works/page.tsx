import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { formatDate, type Locale } from "@/lib/i18n";

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

export default async function WorksPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");
  const locale = (ctx.locale as Locale) || "es";
  const supabase = await createClient();

  const { data: works } = await supabase
    .from("work_orders")
    .select(
      `id, status, actual_price, created_at, started_at, completed_at,
       quotes(quote_number, clients(name))`,
    )
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="mx-auto max-w-lg p-4 pb-28">
      <PageHeader
        title="Trabajos"
        subtitle="Desde presupuesto aprobado hasta entrega"
      />

      <ul className="space-y-2">
        {(works ?? []).map((w) => {
          const quote = Array.isArray(w.quotes) ? w.quotes[0] : w.quotes;
          const client = quote
            ? ((quote.clients as { name?: string } | null)?.name ?? null)
            : null;
          return (
            <li key={w.id}>
              <Link
                href={`/works/${w.id}` as Route}
                className="block rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_1px_2px_rgba(28,29,31,0.04)] transition-colors hover:border-[var(--primary)]/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="metric text-sm font-semibold">
                      #{String(quote?.quote_number ?? 0).padStart(3, "0")}
                    </p>
                    <p className="text-sm text-[var(--ink-muted)]">{client}</p>
                  </div>
                  <StatusBadge
                    status={w.status}
                    label={WORK_LABEL[w.status] ?? w.status}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--ink-muted)]">
                  {formatDate(w.created_at, locale, ctx.timezone)}
                  {w.completed_at
                    ? ` · listo ${formatDate(w.completed_at, locale)}`
                    : ""}
                </p>
              </Link>
            </li>
          );
        })}
        {!works?.length && (
          <li>
            <EmptyState
              title="Sin trabajos activos"
              description="Aprueba un presupuesto para convertirlo en trabajo."
            />
          </li>
        )}
      </ul>
    </main>
  );
}
