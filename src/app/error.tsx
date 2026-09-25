"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/primitives";
import { useI18n } from "@/components/i18n/i18n-provider";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6 text-center">
      <p className="font-display text-3xl">{t("error.title")}</p>
      <p className="mt-2 max-w-sm text-sm text-[var(--ink-muted)]">
        {t("error.generic")}
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[11px] text-[var(--ink-muted)]">
          {t("error.digest", { digest: error.digest })}
        </p>
      )}
      <div className="mt-6 flex gap-2">
        <Button onClick={reset} type="button">
          {t("common.retry")}
        </Button>
        <Link
          href={"/dashboard" as Route}
          className="inline-flex h-11 items-center rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold"
        >
          {t("error.home")}
        </Link>
      </div>
    </main>
  );
}
