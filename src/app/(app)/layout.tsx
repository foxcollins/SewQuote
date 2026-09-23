import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/nav/bottom-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getSessionContext } from "@/lib/session";

export const metadata: Metadata = { title: "SewQuote" };
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--canvas)]/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-lg items-center justify-between px-4">
          <span className="font-display text-lg">SewQuote</span>
          <div className="flex items-center gap-3">
            <span className="max-w-[140px] truncate text-xs font-semibold text-[var(--ink-muted)]">
              {ctx.tenantName}
            </span>
            <SignOutButton label="Salir" />
            <a
              href="/settings"
              className="text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--primary)]"
              aria-label="Configuración"
            >
              ⚙
            </a>
          </div>
        </div>
      </header>
      {children}
      <BottomNav />
    </div>
  );
}
