"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/nav/bottom-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useQueryToasts } from "@/components/ui/toast";

const nav = [
  { href: "/dashboard" as Route, label: "Dashboard", icon: "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z" },
  { href: "/quotes" as Route, label: "Presupuestos", icon: "M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm7 0v5h5" },
  { href: "/works" as Route, label: "Trabajos", icon: "M4 7h16M4 12h16M4 17h10" },
  { href: "/clients" as Route, label: "Clientes", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { href: "/catalog" as Route, label: "Catálogo", icon: "M4 6h16M4 12h16M4 18h16" },
  { href: "/settings" as Route, label: "Configuración", icon: "M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

function LogoMark() {
  return (
    <span className="inline-flex size-9 items-center justify-center rounded-[8px] border border-[var(--border)] bg-[var(--surface)] text-[var(--primary)]">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
        <path d="M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.5 7.5 20 18M8.5 16.5 20 6" />
      </svg>
    </span>
  );
}

function DesktopSidebar({ tenantName }: { tenantName: string }) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:flex">
      <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-4">
        <LogoMark />
        <div className="min-w-0">
          <p className="font-display text-lg leading-none tracking-tight">SewQuote</p>
          <p className="mt-0.5 truncate text-[11px] text-[var(--ink-muted)]">{tenantName}</p>
        </div>
      </div>

      <div className="px-3 pt-4">
        <Link
          href={"/quotes/new" as Route}
          className="flex h-11 items-center justify-center gap-2 rounded-[6px] bg-[var(--primary)] text-sm font-semibold text-[var(--on-primary)] transition-colors hover:bg-[var(--primary-hover)]"
        >
          + Nuevo presupuesto
        </Link>
      </div>

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Principal">
        {nav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 items-center gap-3 rounded-[6px] px-3 text-sm font-semibold transition-colors ${
                active
                  ? "border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
              }`}
            >
              <svg viewBox="0 0 24 24" className="size-4.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] px-3 py-3">
        <SignOutButton label="Salir" />
      </div>
    </aside>
  );
}

function DesktopTopbar({ tenantName }: { tenantName: string }) {
  return (
    <header className="sticky top-0 z-30 hidden h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--canvas)]/92 px-6 backdrop-blur-md lg:flex">
      <div className="relative min-w-0 flex-1 max-w-md">
        <input
          type="search"
          placeholder="Buscar cliente, trabajo o #presupuesto…"
          className="h-9 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] pl-8 pr-3 text-xs text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)] focus:border-[var(--primary)]"
        />
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" aria-hidden>
          ⌕
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-muted)] xl:inline">
          {tenantName}
        </span>
        <Link
          href={"/settings" as Route}
          className="flex size-9 items-center justify-center rounded-[6px] text-sm text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
          aria-label="Configuración"
        >
          ⚙
        </Link>
        <Link
          href={"/quotes/new" as Route}
          className="ml-1 inline-flex h-9 items-center rounded-[6px] bg-[var(--primary)] px-3 text-xs font-semibold text-[var(--on-primary)] transition-colors hover:bg-[var(--primary-hover)]"
        >
          + Nuevo encargo
        </Link>
      </div>
    </header>
  );
}

function MobileHeader({ tenantName }: { tenantName: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--canvas)]/92 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-2 px-4">
        <Link
          href={"/dashboard" as Route}
          className="flex min-w-0 items-center gap-2 font-display text-xl tracking-tight text-[var(--ink)]"
        >
          <LogoMark />
          <span className="truncate">SewQuote</span>
        </Link>
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <span className="max-w-[96px] truncate rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-muted)] sm:max-w-[120px]">
            {tenantName}
          </span>
          <Link
            href={"/settings" as Route}
            className="flex size-10 items-center justify-center rounded-[6px] text-sm text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
            aria-label="Configuración"
          >
            ⚙
          </Link>
          <SignOutButton label="Salir" />
        </div>
      </div>
    </header>
  );
}

export function AppShell({
  tenantName,
  children,
}: {
  tenantName: string;
  children: React.ReactNode;
}) {
  useQueryToasts();
  return (
    <div className="min-h-screen">
      <DesktopSidebar tenantName={tenantName} />
      <div className="lg:pl-60">
        <DesktopTopbar tenantName={tenantName} />
        <MobileHeader tenantName={tenantName} />
        <div className="mx-auto w-full max-w-6xl px-4 py-4 pb-28 lg:max-w-none lg:px-8 lg:pb-8">
          {children}
        </div>
      </div>
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
