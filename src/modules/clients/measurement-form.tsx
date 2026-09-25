"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, inputClass } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n/i18n-provider";
import { defaultMeasurementFieldNames, translateError } from "@/lib/i18n";
import { createMeasurementSetAction } from "@/modules/clients/actions";

export function MeasurementForm({ personId }: { personId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { locale, t } = useI18n();
  const [rows, setRows] = useState(() =>
    defaultMeasurementFieldNames(locale).map((name) => ({
      name,
      value: "",
      unit: "cm",
    })),
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
          toast(t("clients.measurements.saved"), "success");
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
          toast(translateError(e, locale), "error");
        } finally {
          setPending(false);
          router.refresh();
        }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="person_id" value={personId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("clients.measurements.label")}>
          <input
            name="label"
            placeholder={t("clients.measurements.label_placeholder")}
            aria-label={t("clients.measurements.label")}
            className={`${inputClass} h-10`}
          />
        </Field>
        <Field label={t("clients.measurements.date")}>
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
          <div key={i} className="grid grid-cols-[minmax(0,1fr)_72px_52px] gap-2">
            <input
              value={row.name}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...row, name: e.target.value };
                setRows(next);
              }}
              placeholder={t("clients.measurements.name")}
              aria-label={t("clients.measurements.name")}
              className="h-10 w-full min-w-0 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
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
              className="metric h-10 w-full min-w-0 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
            />
            <input
              value={row.unit}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...row, unit: e.target.value };
                setRows(next);
              }}
              aria-label={t("clients.measurements.unit")}
              className="h-10 w-full min-w-0 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
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

      <label className="block text-sm font-semibold">
        {t("clients.measurements.notes")}
        <textarea
          name="notes"
          rows={2}
          className={`${inputClass} h-auto min-h-[64px] py-2`}
        />
      </label>

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {t("clients.measurements.save")}
      </Button>
    </form>
  );
}
