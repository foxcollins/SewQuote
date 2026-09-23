"use client";

import { useState } from "react";
import { createPersonAction } from "@/modules/clients/actions";

export function PersonForm({ clientId }: { clientId?: string }) {
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (fd) => {
        setPending(true);
        try {
          await createPersonAction(fd);
        } finally {
          setPending(false);
        }
      }}
      className="space-y-3 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <input type="hidden" name="client_id" value={clientId ?? ""} />
      <label className="block text-sm font-semibold">
        Nombre de la persona *
        <input
          name="name"
          required
          placeholder="ej: Ana"
          className="mt-1 h-11 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
        />
      </label>
      <label className="block text-sm font-semibold">
        Notas
        <textarea
          name="notes"
          rows={2}
          className="mt-1 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-[6px] bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--on-primary)] disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Añadir persona"}
      </button>
    </form>
  );
}
