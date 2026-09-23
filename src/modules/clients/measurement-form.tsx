"use client";

import { useState } from "react";
import { createMeasurementSetAction } from "@/modules/clients/actions";

const DEFAULT_FIELDS = ["Busto", "Cintura", "Cadera", "Largo", "Manga", "Hombro", "Cuello"];

export function MeasurementForm({ personId }: { personId: string }) {
  const [rows, setRows] = useState(
    DEFAULT_FIELDS.map((name) => ({ name, value: "", unit: "cm" })),
  );
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (fd) => {
        setPending(true);
        try {
          rows.forEach((r) => {
            fd.append("m_name", r.name);
            fd.append("m_value", r.value);
            fd.append("m_unit", r.unit);
          });
          await createMeasurementSetAction(fd);
        } finally {
          setPending(false);
        }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="person_id" value={personId} />
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold">
          Etiqueta
          <input
            name="label"
            placeholder="Medidas 2026-09"
            className="mt-1 h-10 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
          />
        </label>
        <label className="block text-sm font-semibold">
          Fecha
          <input
            type="date"
            name="recorded_at"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="mt-1 h-10 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
          />
        </label>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_56px] gap-2">
            <input
              value={row.name}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...row, name: e.target.value };
                setRows(next);
              }}
              placeholder="Nombre"
              className="h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
            />
            <input
              value={row.value}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...row, value: e.target.value };
                setRows(next);
              }}
              placeholder="0"
              inputMode="decimal"
              className="metric h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
            />
            <input
              value={row.unit}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...row, unit: e.target.value };
                setRows(next);
              }}
              className="h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          setRows([...rows, { name: "", value: "", unit: "cm" }])
        }
        className="text-xs font-semibold text-[var(--primary)]"
      >
        + Campo
      </button>

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
        className="h-11 w-full rounded-[6px] bg-[var(--primary)] text-sm font-semibold text-[var(--on-primary)] disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar set de medidas"}
      </button>
    </form>
  );
}
