"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="flex size-10 items-center justify-center rounded-[6px] text-[11px] font-semibold text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--error)]"
      aria-label={label}
    >
      <span aria-hidden>⏻</span>
      <span className="sr-only">{label}</span>
    </button>
  );
}
