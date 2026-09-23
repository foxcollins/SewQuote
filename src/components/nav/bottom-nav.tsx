import Link from "next/link";
import type { Route } from "next";

const items = [
  { href: "/dashboard" as Route, key: "nav.dashboard" as const, label: "Dashboard" },
  { href: "/quotes" as Route, key: "nav.quotes" as const, label: "Presupuestos" },
  { href: "/quotes/new" as Route, key: "nav.new_quote" as const, label: "+ Nuevo" },
  { href: "/works" as Route, key: "nav.work_orders" as const, label: "Trabajos" },
  { href: "/clients" as Route, key: "nav.clients" as const, label: "Clientes" },
];

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)]"
      style={{
        background: "color-mix(in srgb, var(--canvas) 92%, transparent)",
        backdropFilter: "blur(12px)",
      }}
      aria-label="Principal"
    >
      <ul className="mx-auto flex h-16 max-w-lg items-stretch justify-between">
        {items.map((item) => (
          <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              className="flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-[var(--ink-muted)] hover:text-[var(--primary)]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
