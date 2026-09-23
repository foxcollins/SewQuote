import type { Metadata } from "next";
import { BottomNav } from "@/components/nav/bottom-nav";

export const metadata: Metadata = { title: "SewQuote" };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--canvas)]/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-lg items-center justify-between px-4">
          <span className="font-display text-lg">SewQuote</span>
          <span className="text-xs font-semibold text-[var(--ink-muted)]">
            Atelier
          </span>
        </div>
      </header>
      {children}
      <BottomNav />
    </div>
  );
}
