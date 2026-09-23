"use client";

import Link from "next/link";
import type { Route } from "next";
import { BottomNav } from "@/components/nav/bottom-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useQueryToasts } from "@/components/ui/toast";

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
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--canvas)]/92 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link
            href={"/dashboard" as Route}
            className="font-display text-xl tracking-tight text-[var(--ink)]"
          >
            SewQuote
          </Link>
          <div className="flex items-center gap-2">
            <span className="max-w-[120px] truncate rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-muted)]">
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
      {children}
      <BottomNav />
    </div>
  );
}
