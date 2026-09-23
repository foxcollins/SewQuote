import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { t, type Locale, formatDate } from "@/lib/i18n";

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");

  const locale = (ctx.locale as Locale) || "es";
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ count: openQuotes }, { count: pendingWorks }, { count: expiring }] =
    await Promise.all([
      supabase
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .in("status", ["draft", "sent"]),
      supabase
        .from("work_orders")
        .select("id", { count: "exact", head: true })
        .not("status", "in", ["delivered", "cancelled"]),
      supabase
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .eq("status", "sent")
        .lte("valid_until", today),
    ]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? locale === "pt-BR"
        ? "Bom dia"
        : "Buenos días"
      : hour < 19
        ? locale === "pt-BR"
          ? "Boa tarde"
          : "Buenas tardes"
        : locale === "pt-BR"
          ? "Boa noite"
          : "Buenas noches";

  return (
    <main className="mx-auto max-w-lg p-4 pb-24">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
          {formatDate(new Date(), locale, ctx.timezone)}
        </p>
        <h1 className="display text-3xl">
          {greeting}, {ctx.profileName.split(" ")[0]}
        </h1>
        <p className="text-sm text-[var(--ink-muted)]">{ctx.tenantName}</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {[
          { n: openQuotes ?? 0, label: "Presupuestos abiertos" },
          { n: pendingWorks ?? 0, label: "Trabajos activos" },
          { n: expiring ?? 0, label: "Vencen / vencidos" },
          { n: 0, label: "Entregas hoy" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <p className="metric text-2xl font-semibold text-[var(--primary)]">
              {m.n}
            </p>
            <p className="text-xs text-[var(--ink-muted)]">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Link
          href={"/quotes/new" as Route}
          className="rounded-[6px] bg-[var(--primary)] px-3 py-3 text-center text-sm font-semibold text-[var(--on-primary)]"
        >
          Nuevo presupuesto
        </Link>
        <Link
          href={"/clients/new" as Route}
          className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-center text-sm font-semibold"
        >
          Nuevo cliente
        </Link>
        <Link
          href={"/catalog" as Route}
          className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-center text-sm font-semibold"
        >
          Catálogo
        </Link>
        <Link
          href={"/settings" as Route}
          className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-center text-sm font-semibold"
        >
          Configuración
        </Link>
      </div>

      <p className="mt-6 text-xs text-[var(--ink-muted)]">
        {t(locale, "dashboard.greeting", { name: ctx.profileName })} · IA en V2
      </p>
    </main>
  );
}
