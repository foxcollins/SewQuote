"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/primitives";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6 text-center">
      <p className="font-display text-3xl">Algo salió mal</p>
      <p className="mt-2 max-w-sm text-sm text-[var(--ink-muted)]">
        No pudimos cargar esta página. Intenta de nuevo o vuelve al inicio.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[11px] text-[var(--ink-muted)]">
          Ref: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-2">
        <Button onClick={reset} type="button">
          Reintentar
        </Button>
        <Link
          href={"/dashboard" as Route}
          className="inline-flex h-11 items-center rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold"
        >
          Inicio
        </Link>
      </div>
    </main>
  );
}
