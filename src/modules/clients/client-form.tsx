"use client";

import { useState } from "react";
import {
  createClientAction,
  updateClientAction,
} from "@/modules/clients/actions";

const inputClass =
  "h-11 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--primary)]";

export function ClientForm({
  mode,
  clientId,
  initial,
}: {
  mode: "create" | "edit";
  clientId?: string;
  initial?: {
    name: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
  };
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      action={async (formData) => {
        setPending(true);
        setError(null);
        try {
          if (mode === "create") {
            await createClientAction(formData);
          } else if (clientId) {
            await updateClientAction(clientId, formData);
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : "Error");
        } finally {
          setPending(false);
        }
      }}
    >
      {error && (
        <p className="rounded-[6px] bg-[var(--error-bg)] px-3 py-2 text-xs text-[var(--error)]">
          {error}
        </p>
      )}
      <label className="block text-sm font-semibold">
        Nombre *
        <input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold">
          Teléfono
          <input
            name="phone"
            defaultValue={initial?.phone ?? ""}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="block text-sm font-semibold">
          WhatsApp
          <input
            name="whatsapp"
            defaultValue={initial?.whatsapp ?? ""}
            className={`mt-1 ${inputClass}`}
          />
        </label>
      </div>
      <label className="block text-sm font-semibold">
        Email
        <input
          name="email"
          type="email"
          defaultValue={initial?.email ?? ""}
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <label className="block text-sm font-semibold">
        Dirección
        <input
          name="address"
          defaultValue={initial?.address ?? ""}
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <label className="block text-sm font-semibold">
        Notas
        <textarea
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
          className={`mt-1 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm`}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-[6px] bg-[var(--primary)] text-sm font-semibold text-[var(--on-primary)] disabled:opacity-60"
      >
        {pending ? "Guardando…" : mode === "create" ? "Crear cliente" : "Guardar"}
      </button>
    </form>
  );
}
