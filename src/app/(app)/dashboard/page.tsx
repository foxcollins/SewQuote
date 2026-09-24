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
    <main className="pb-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
          {formatDate(new Date(), locale, ctx.timezone)}
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="display text-3xl lg:text-4xl">
              {greeting}, {ctx.profileName.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">{ctx.tenantName}</p>
          </div>
          <p className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--ink-muted)]">
            Pulso operativo del taller
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { n: openQuotes ?? 0, label: "Presupuestos abiertos" },
          { n: pendingWorks ?? 0, label: "Trabajos activos" },
          { n: expiring ?? 0, label: "Vencen / vencidos" },
          { n: 0, label: "Entregas hoy" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_1px_2px_rgba(28,29,31,0.04)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              {m.label}
            </p>
            <p className="metric mt-1 text-3xl font-semibold text-[var(--primary)]">
              {m.n}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            Accesos rápidos
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href={"/quotes/new" as Route}
              className="rounded-[8px] bg-[var(--primary)] px-3 py-3.5 text-center text-sm font-semibold text-[var(--on-primary)] transition-colors hover:bg-[var(--primary-hover)]"
            >
              Nuevo presupuesto
            </Link>
            <Link
              href={"/clients/new" as Route}
              className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-3.5 text-center text-sm font-semibold transition-colors hover:border-[var(--primary)]/40"
            >
              Nuevo cliente
            </Link>
            <Link
              href={"/catalog" as Route}
              className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-3.5 text-center text-sm font-semibold transition-colors hover:border-[var(--primary)]/40"
            >
              Catálogo
            </Link>
            <Link
              href={"/settings" as Route}
              className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-3.5 text-center text-sm font-semibold transition-colors hover:border-[var(--primary)]/40"
            >
              Configuración
            </Link>
          </div>
          <p className="text-xs text-[var(--ink-muted)]">
            {t(locale, "dashboard.greeting", { name: ctx.profileName })} · IA en V2
          </p>
        </section>

        <aside className="space-y-3">
          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              Enlace público
            </h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Comparte presupuestos con tu clienta por link o WhatsApp y registra
              la aprobación sin cuenta.
            </p>
            <Link
              href={"/quotes" as Route}
              className="mt-3 inline-flex h-9 items-center rounded-[6px] border border-[var(--border)] px-3 text-xs font-semibold transition-colors hover:border-[var(--primary)]/40"
            >
              Ver presupuestos
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
