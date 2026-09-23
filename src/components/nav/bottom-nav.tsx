"use client";

"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard" as Route, label: "Inicio", icon: "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z" },
  { href: "/quotes" as Route, label: "Quotes", icon: "M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm7 0v5h5" },
  { href: "/quotes/new" as Route, label: "Nuevo", icon: "M12 5v14M5 12h14", cta: true },
  { href: "/works" as Route, label: "Trabajos", icon: "M4 7h16M4 12h16M4 17h10" },
  { href: "/clients" as Route, label: "Clientes", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { href: "/catalog" as Route, label: "Catálogo", icon: "M4 6h16M4 12h16M4 18h16" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/quotes/new") return pathname === "/quotes/new";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)]"
      style={{
        background: "color-mix(in srgb, var(--canvas) 94%, transparent)",
        backdropFilter: "blur(14px)",
      }}
      aria-label="Principal"
    >
      <ul className="mx-auto flex h-[68px] max-w-lg items-stretch justify-between px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          if (item.cta) {
            return (
              <li key={item.href} className="flex flex-1 items-center justify-center">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className="flex size-12 -translate-y-1 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--on-primary)] shadow-[0_6px_16px_rgba(200,90,50,0.35)] transition-transform hover:scale-105 active:scale-95"
                >
                  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d={item.icon} />
                  </svg>
                </Link>
              </li>
            );
          }
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 rounded-[6px] text-[10px] font-semibold transition-colors ${
                  active
                    ? "text-[var(--primary)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
