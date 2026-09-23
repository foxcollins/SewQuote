"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/primitives";

export default function AppRouteError({
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
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center p-6 text-center">
      <p className="font-display text-3xl">No se pudo cargar</p>
      <p className="mt-2 max-w-sm text-sm text-[var(--ink-muted)]">
        Ocurrió un error en el servidor. Vuelve a intentarlo.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[11px] text-[var(--ink-muted)]">
          Ref: {error.digest}
        </p>
      )}
      <div className="mt-6">
        <Button type="button" onClick={reset}>
          Reintentar
        </Button>
      </div>
    </main>
  );
}
