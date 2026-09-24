"use client";

import { useState } from "react";
import { Button, Field, Modal, inputClass } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import {
  createMeasurementSetJsonAction,
  createPersonJsonAction,
  type MeasurementSetJson,
  type PersonJson,
} from "@/modules/clients/actions";

const DEFAULT_FIELDS = [
  "Busto",
  "Cintura",
  "Cadera",
  "Largo",
  "Manga",
  "Hombro",
  "Cuello",
];

export function PersonQuickAddModal({
  open,
  onClose,
  clientId,
  clientName,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName?: string;
  onCreated: (person: PersonJson) => void;
}) {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || !name.trim()) return;
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("name", name.trim());
      fd.set("notes", notes.trim());
      fd.set("client_id", clientId);
      const person = await createPersonJsonAction(fd);
      toast(`Persona “${person.name}” añadida`, "success");
      onCreated(person);
      setName("");
      setNotes("");
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Añadir persona destinataria"
    >
      <p className="mb-4 text-sm text-[var(--ink-muted)]">
        Quien usa la prenda
        {clientName ? ` · cliente ${clientName}` : ""}. Se queda en este
        presupuesto sin salir.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nombre *">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="ej: Ana"
            className={inputClass}
            autoFocus
          />
        </Field>
        <Field label="Notas (opcional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={`${inputClass} h-auto min-h-[64px] py-2`}
          />
        </Field>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={pending} className="flex-1">
            Añadir y usar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function MeasurementQuickAddModal({
  open,
  onClose,
  personId,
  personName,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  personId: string;
  personName?: string;
  onCreated: (set: MeasurementSetJson) => void;
}) {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [rows, setRows] = useState(
    DEFAULT_FIELDS.map((n) => ({ name: n, value: "", unit: "cm" })),
  );
  const [label, setLabel] = useState("");
  const [recordedAt, setRecordedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const filled = rows.filter((r) => r.name.trim() && r.value.trim());
    if (!filled.length) {
      toast("Indica al menos una medida con valor", "error");
      return;
    }
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("person_id", personId);
      fd.set("label", label.trim());
      fd.set("recorded_at", recordedAt);
      fd.set("notes", notes.trim());
      for (const r of filled) {
        fd.append("m_name", r.name.trim());
        fd.append("m_value", r.value.trim());
        fd.append("m_unit", r.unit.trim() || "cm");
      }
      const set = await createMeasurementSetJsonAction(fd);
      toast("Medidas guardadas", "success");
      onCreated(set);
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar medidas">
      <p className="mb-4 text-sm text-[var(--ink-muted)]">
        {personName ? `Para ${personName}. ` : ""}
        Se guarda como set nuevo; no sobrescribe el historial.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Etiqueta">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Medidas hoy"
              className={`${inputClass} h-10`}
            />
          </Field>
          <Field label="Fecha">
            <input
              type="date"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
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

        <Field label="Notas (opcional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={`${inputClass} h-auto min-h-[64px] py-2`}
          />
        </Field>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button type="submit" loading={pending} className="flex-1">
            Guardar set
          </Button>
        </div>
      </form>
    </Modal>
  );
}
