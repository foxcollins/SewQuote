"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, inputClass } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { createMeasurementSetAction } from "@/modules/clients/actions";

const DEFAULT_FIELDS = ["Busto", "Cintura", "Cadera", "Largo", "Manga", "Hombro", "Cuello"];

export function MeasurementForm({ personId }: { personId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState(
    DEFAULT_FIELDS.map((name) => ({ name, value: "", unit: "cm" })),
  );
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (fd) => {
        if (pending) return;
        setPending(true);
        try {
          rows.forEach((r) => {
            fd.append("m_name", r.name);
            fd.append("m_value", r.value);
            fd.append("m_unit", r.unit);
          });
          await createMeasurementSetAction(fd);
          toast("Medidas guardadas", "success");
        } catch (e) {
          if (
            e &&
            typeof e === "object" &&
            "digest" in e &&
            typeof e.digest === "string" &&
            e.digest.includes("NEXT_REDIRECT")
          ) {
            return;
          }
          const msg = e instanceof Error ? e.message : "Error al guardar";
          toast(msg, "error");
        } finally {
          setPending(false);
          router.refresh();
        }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="person_id" value={personId} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Etiqueta">
          <input
            name="label"
            placeholder="Medidas 2026-09"
            className={`${inputClass} h-10`}
          />
        </Field>
        <Field label="Fecha">
          <input
            type="date"
            name="recorded_at"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={`${inputClass} h-10`}
          />
        </Field>
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
          className={`${inputClass} h-auto min-h-[64px] py-2`}
        />
      </label>

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Guardar set de medidas
      </Button>
    </form>
  );
}
