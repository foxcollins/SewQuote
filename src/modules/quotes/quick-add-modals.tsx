"use client";

import { useState } from "react";
import { Button, Field, Modal, inputClass } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n/i18n-provider";
import { defaultMeasurementFieldNames, translateError } from "@/lib/i18n";
import {
  createMeasurementSetJsonAction,
  createPersonJsonAction,
  type MeasurementSetJson,
  type PersonJson,
} from "@/modules/clients/actions";

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
  const { locale, t } = useI18n();
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
      toast(t("quotes.quick.person_created", { name: person.name }), "success");
      onCreated(person);
      setName("");
      setNotes("");
      onClose();
    } catch (err) {
      toast(translateError(err, locale), "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("quotes.quick.person_title")}
    >
      <p className="mb-4 text-sm text-[var(--ink-muted)]">
        {t("quotes.quick.person_hint")}
        {clientName ? ` · ${t("quotes.quick.client_of", { name: clientName })}` : ""}
      </p>
      <form onSubmit={submit} className="space-y-3">
        <Field label={t("clients.person.name")}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={t("clients.person.name_placeholder")}
            aria-label={t("clients.person.name")}
            className={inputClass}
            autoFocus
          />
        </Field>
        <Field label={t("common.optional")}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            aria-label={t("clients.person.notes")}
            className={`${inputClass} h-auto min-h-[64px] py-2`}
          />
        </Field>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={pending} className="flex-1">
            {t("quotes.quick.add_and_use")}
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
  const { locale, t } = useI18n();
  const [pending, setPending] = useState(false);
  const [rows, setRows] = useState(() =>
    defaultMeasurementFieldNames(locale).map((name) => ({
      name,
      value: "",
      unit: "cm",
    })),
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
      toast(t("quotes.quick.measurements_required"), "error");
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
      toast(t("clients.measurements.saved"), "success");
      onCreated(set);
      onClose();
    } catch (err) {
      toast(translateError(err, locale), "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("quotes.quick.measurements_title")}>
      <p className="mb-4 text-sm text-[var(--ink-muted)]">
        {personName ? `${t("quotes.quick.measurements_for", { name: personName })} ` : ""}
        {t("quotes.quick.measurements_hint")}
      </p>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("clients.measurements.label")}>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("quotes.quick.measurements_today")}
              aria-label={t("clients.measurements.label")}
              className={`${inputClass} h-10`}
            />
          </Field>
          <Field label={t("clients.measurements.date")}>
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
                placeholder={t("clients.measurements.name")}
                aria-label={t("clients.measurements.name")}
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
                aria-label={t("clients.measurements.value")}
                className="metric h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
              />
              <input
                value={row.unit}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...row, unit: e.target.value };
                  setRows(next);
                }}
                aria-label={t("clients.measurements.unit")}
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
          {t("clients.measurements.add")}
        </button>

        <Field label={t("common.optional")}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            aria-label={t("clients.measurements.notes")}
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
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={pending} className="flex-1">
            {t("quotes.quick.save_set")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
