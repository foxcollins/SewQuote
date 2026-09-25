"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/primitives";
import { useI18n } from "@/components/i18n/i18n-provider";

export default function AppRouteError({
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
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center p-6 text-center">
      <p className="font-display text-3xl">{t("error.load_failed")}</p>
      <p className="mt-2 max-w-sm text-sm text-[var(--ink-muted)]">
        {t("error.server")}
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[11px] text-[var(--ink-muted)]">
          {t("error.digest", { digest: error.digest })}
        </p>
      )}
      <div className="mt-6">
        <Button type="button" onClick={reset}>
          {t("common.retry")}
        </Button>
      </div>
    </main>
  );
}
