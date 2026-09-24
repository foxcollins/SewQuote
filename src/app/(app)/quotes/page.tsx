import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  EmptyState,
  PageHeader,
  PrimaryLink,
} from "@/components/ui/primitives";
import { formatMoney, formatDate, type Locale } from "@/lib/i18n";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  accepted: "Aprobado",
  rejected: "Rechazado",
  expired: "Vencido",
  cancelled: "Cancelado",
};

export default async function QuotesPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");
  const locale = (ctx.locale as Locale) || "es";
  const supabase = await createClient();

  const { data: quotes } = await supabase
    .from("quotes")
    .select(
      "id, quote_number, status, suggested_price, final_price, valid_until, created_at, currency, clients(name)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="pb-8">
      <PageHeader
        title="Presupuestos"
        subtitle="Borradores, enviados y aprobados"
        action={
          <PrimaryLink href={"/quotes/new" as Route} size="sm">
            + Nuevo
          </PrimaryLink>
        }
      />

      <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {(quotes ?? []).map((q) => {
          const client = q.clients as { name?: string } | null;
          const price = q.final_price ?? q.suggested_price;
          return (
            <li key={q.id}>
              <Link
                href={`/quotes/${q.id}` as Route}
                className="block rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_1px_2px_rgba(28,29,31,0.04)] transition-colors hover:border-[var(--primary)]/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="metric text-sm font-semibold">
                      #{String(q.quote_number).padStart(3, "0")}
                    </p>
                    <p className="text-sm text-[var(--ink-muted)]">
                      {client?.name ?? "—"}
                    </p>
                  </div>
                  <StatusBadge
                    status={q.status}
                    label={STATUS_LABEL[q.status] ?? q.status}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-[var(--ink-muted)]">
                    {formatDate(q.created_at, locale, ctx.timezone)}
                    {q.valid_until
                      ? ` · vence ${formatDate(q.valid_until, locale)}`
                      : ""}
                  </p>
                  <p className="metric text-sm font-semibold">
                    {formatMoney(Number(price ?? 0), q.currency ?? ctx.currency, locale)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
        {!quotes?.length && (
          <li>
            <EmptyState
              title="Sin presupuestos"
              description="Crea el primero para enviar a tu clienta."
              action={
                <PrimaryLink href={"/quotes/new" as Route} size="sm">
                  Nuevo presupuesto
                </PrimaryLink>
              }
            />
          </li>
        )}
      </ul>
    </main>
  );
}
