"use client";

import { useMemo, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  calculateQuote,
  type Complexity,
  type LaborMethod,
  type QuoteJobInput,
  type TenantPricingConfig,
  type Urgency,
} from "@/modules/pricing/engine";
import { formatDate, formatMeasurement, formatMoney, measurementFieldLabel, type Locale } from "@/lib/i18n";
import { saveQuoteDraftAction, updateQuoteDraftAction } from "@/modules/quotes/actions";
import type {
  MeasurementSetJson,
  PersonJson,
} from "@/modules/clients/actions";
import {
  MeasurementQuickAddModal,
  PersonQuickAddModal,
} from "@/modules/quotes/quick-add-modals";
import { Button, Card, SectionTitle, inputClass } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n/i18n-provider";
import { complexityLabel, translateError, urgencyLabel } from "@/lib/i18n";

type ClientOpt = { id: string; name: string };
type PersonOpt = { id: string; name: string; client_id: string | null };
type ServiceOpt = { id: string; name: string; base_price: number | null; estimated_minutes: number | null; active?: boolean };
type MaterialOpt = { id: string; name: string; unit: string; unit_price: number };
type CategoryOpt = { id: string; name: string };
type MeasurementSetOpt = MeasurementSetJson;

type JobLine = {
  job_category_id: string;
  person_id: string;
  garment_type: string;
  garment_description: string;
  labor_method: LaborMethod;
  labor_fixed_price: string;
  estimated_minutes: string;
  complexity: Complexity;
  urgency: Urgency;
  measurement_set_id: string;
  notes: string;
  services: { service_id: string; quantity: string }[];
  materials: { material_id: string; quantity: string; waste_percent: string }[];
  other_costs: string;
};

function emptyJob(): JobLine {
  return {
    job_category_id: "",
    person_id: "",
    garment_type: "",
    garment_description: "",
    labor_method: "fixed",
    labor_fixed_price: "",
    estimated_minutes: "",
    complexity: "medium",
    urgency: "normal",
    measurement_set_id: "",
    notes: "",
    services: [],
    materials: [],
    other_costs: "",
  };
}

function setsForPerson(
  sets: MeasurementSetOpt[],
  personId: string,
): MeasurementSetOpt[] {
  if (!personId) return [];
  return sets
    .filter((s) => s.person_id === personId)
    .sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1));
}

function setAgeDays(recordedAt: string): number {
  const t = new Date(recordedAt).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

export type QuoteBuilderJobDraft = JobLine;

export type QuoteBuilderInitial = {
  id: string;
  clientId: string;
  marginPercent: number | null;
  validUntil: string;
  notes: string;
  otherCostsAmount: number;
  jobs: QuoteBuilderJobDraft[];
};

export function QuoteBuilder({
  clients,
  persons: personsInitial,
  measurementSets: setsInitial,
  services,
  materials,
  categories,
  config,
  currency,
  locale,
  presetClientId,
  presetClientName,
  staleDays = 30,
  initial,
}: {
  clients: ClientOpt[];
  persons: PersonOpt[];
  measurementSets?: MeasurementSetOpt[];
  services: ServiceOpt[];
  materials: MaterialOpt[];
  categories: CategoryOpt[];
  config: TenantPricingConfig;
  currency: string;
  locale: Locale;
  presetClientId?: string;
  presetClientName?: string;
  staleDays?: number;
  initial?: QuoteBuilderInitial;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [clientId, setClientId] = useState(initial?.clientId ?? presetClientId ?? "");
  const [persons, setPersons] = useState<PersonOpt[]>(personsInitial);
  const [measurementSets, setMeasurementSets] = useState<MeasurementSetOpt[]>(
    setsInitial ?? [],
  );
  const [margin, setMargin] = useState(
    String(initial?.marginPercent ?? config.defaultMarginPercent),
  );
  const [validUntil, setValidUntil] = useState(() => {
    if (initial?.validUntil) return initial.validUntil;
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [jobs, setJobs] = useState<JobLine[]>(
    initial?.jobs?.length ? initial.jobs : [emptyJob()],
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personModalJob, setPersonModalJob] = useState<number | null>(null);
  const [measureModal, setMeasureModal] = useState<{
    jobIndex: number;
    personId: string;
    personName: string;
  } | null>(null);

  const clientPersons = useMemo(
    () => persons.filter((p) => !clientId || !p.client_id || p.client_id === clientId),
    [persons, clientId],
  );

  const activeClientName =
    clients.find((c) => c.id === clientId)?.name ?? presetClientName;

  function updateJob(i: number, patch: Partial<JobLine>) {
    setJobs((prev) => prev.map((j, idx) => (idx === i ? { ...j, ...patch } : j)));
  }

  function onSelectPerson(i: number, personId: string) {
    const available = setsForPerson(measurementSets, personId);
    const latest = available[0];
    updateJob(i, {
      person_id: personId,
      measurement_set_id: personId && latest ? latest.id : "",
    });
  }

  function onPersonCreated(person: PersonJson) {
    setPersons((prev) =>
      prev.some((p) => p.id === person.id)
        ? prev
        : [...prev, { id: person.id, name: person.name, client_id: person.client_id }],
    );
    if (personModalJob != null) {
      onSelectPerson(personModalJob, person.id);
    }
    setPersonModalJob(null);
  }

  function onMeasurementCreated(set: MeasurementSetJson) {
    setMeasurementSets((prev) => [set, ...prev]);
    if (measureModal) {
      updateJob(measureModal.jobIndex, { measurement_set_id: set.id });
    }
    setMeasureModal(null);
  }

  const engineJobs: QuoteJobInput[] = jobs.map((job) => ({
    laborMethod: job.labor_method,
    laborFixedPrice:
      job.labor_method === "fixed" ? Number(job.labor_fixed_price || 0) : undefined,
    estimatedMinutes:
      job.labor_method === "hourly" ? Number(job.estimated_minutes || 0) : undefined,
    complexity: job.complexity,
    urgency: job.urgency,
    materials: job.materials.map((m) => {
      const mat = materials.find((x) => x.id === m.material_id);
      return {
        quantity: Number(m.quantity || 0),
        unitPrice: Number(mat?.unit_price ?? 0),
      };
    }),
    otherCosts: Number(job.other_costs || 0),
  }));

  const preview = useMemo(() => {
    try {
      return calculateQuote(
        {
          jobs: engineJobs,
          marginPercent: Number(margin),
        },
        config,
      );
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, margin, materials, config]);

  async function submit() {
    setPending(true);
    setError(null);
    try {
      if (!clientId) throw new Error(t("quotes.builder.person_required"));
      const payload = {
        client_id: clientId,
        margin_percent: Number(margin),
        valid_until: validUntil,
        notes,
        jobs: jobs.map((job) => ({
          job_category_id: job.job_category_id || null,
          person_id: job.person_id || null,
          garment_type: job.garment_type,
          garment_description: job.garment_description,
          labor_method: job.labor_method,
          labor_fixed_price:
            job.labor_method === "fixed" ? Number(job.labor_fixed_price || 0) : null,
          estimated_minutes:
            job.labor_method === "hourly" ? Number(job.estimated_minutes || 0) : null,
          complexity: job.complexity,
          urgency: job.urgency,
          measurement_set_id: job.measurement_set_id || null,
          notes: job.notes,
          services: job.services
            .filter((s) => s.service_id)
            .map((s) => ({
              service_id: s.service_id,
              quantity: Number(s.quantity || 1),
            })),
          materials: job.materials
            .filter((m) => m.material_id)
            .map((m) => ({
              material_id: m.material_id,
              quantity: Number(m.quantity || 0),
              waste_percent: m.waste_percent
                ? Number(m.waste_percent)
                : undefined,
            })),
          other_costs: Number(job.other_costs || 0),
        })),
      };
      if (initial?.id) {
        await updateQuoteDraftAction(initial.id, JSON.stringify(payload));
        toast(t("quotes.builder.updated"), "success");
        router.push(`/quotes/${initial.id}` as Route);
      } else {
        await saveQuoteDraftAction(JSON.stringify(payload));
        toast(t("quotes.builder.saved"), "success");
        router.push("/quotes" as Route);
      }
      router.refresh();
    } catch (e) {
      const msg = translateError(e, locale);
      setError(msg);
      toast(msg, "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-[6px] bg-[var(--error-bg)] px-3 py-2 text-xs text-[var(--error)]">
          {error}
        </p>
      )}

      <PersonQuickAddModal
        open={personModalJob != null}
        onClose={() => setPersonModalJob(null)}
        clientId={clientId}
        clientName={activeClientName}
        onCreated={onPersonCreated}
      />
      {measureModal && (
        <MeasurementQuickAddModal
          open
          onClose={() => setMeasureModal(null)}
          personId={measureModal.personId}
          personName={measureModal.personName}
          onCreated={onMeasurementCreated}
        />
      )}

      <Card className="p-4">
        <SectionTitle>{t("quotes.builder.client")}</SectionTitle>
        <label className="block text-sm font-semibold">
          {t("clients.name")}
          <select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setJobs((prev) =>
                prev.map((j) => ({ ...j, person_id: "", measurement_set_id: "" })),
              );
            }}
            className={inputClass}
            required
          >
            <option value="">{t("quotes.builder.choose_client")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            {t("quotes.builder.margin")}
            <input
              type="number"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            {t("public.valid_until")}
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <label className="mt-3 block text-sm font-semibold">
          {t("quotes.builder.quote_notes")}
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none"
          />
        </label>
      </Card>

      {jobs.map((job, i) => {
        const personSets = setsForPerson(measurementSets, job.person_id);
        const selectedSet = personSets.find((s) => s.id === job.measurement_set_id);
        const personName =
          persons.find((p) => p.id === job.person_id)?.name ?? undefined;
        const ageDays = selectedSet ? setAgeDays(selectedSet.recorded_at) : 0;
        const isStale = ageDays > staleDays;
        const months = Math.floor(ageDays / 30);

        return (
        <Card
          key={i}
          className="p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle>
              {t("quotes.builder.piece_number", { number: i + 1 })}
            </SectionTitle>
            {jobs.length > 1 && (
              <button
                type="button"
                onClick={() => setJobs(jobs.filter((_, idx) => idx !== i))}
                className="text-xs font-semibold text-[var(--error)]"
              >
                {t("quotes.builder.remove_piece")}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">
              {t("catalog.categories")}
              <select
                value={job.job_category_id}
                onChange={(e) => updateJob(i, { job_category_id: e.target.value })}
                className={inputClass}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="block text-sm font-semibold">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span>{t("quotes.builder.person")}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!clientId) {
                      toast(t("quotes.builder.choose_client_first"), "error");
                      return;
                    }
                    setPersonModalJob(i);
                  }}
                  className="text-xs font-semibold text-[var(--primary)]"
                >
                  {t("quotes.builder.add_person")}
                </button>
              </div>
              <select
                value={job.person_id}
                onChange={(e) => onSelectPerson(i, e.target.value)}
                className={inputClass}
              >
                <option value="">
                  —{" "}
                  {job.garment_type
                    ? t("quotes.builder.no_person")
                    : t("quotes.builder.optional")}
                </option>
                {clientPersons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 rounded-[6px] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase text-[var(--ink-muted)]">
                {t("quotes.builder.measurements")}{" "}
                <span className="font-normal normal-case">
                  {t("quotes.builder.measurements_hint")}
                </span>
              </p>
              {job.person_id && (
                <button
                  type="button"
                  onClick={() =>
                    setMeasureModal({
                      jobIndex: i,
                      personId: job.person_id,
                      personName: personName ?? "",
                    })
                  }
                  className="text-xs font-semibold text-[var(--primary)]"
                >
                  {t("quotes.builder.add_measurements")}
                </button>
              )}
            </div>

            {!job.person_id ? (
              <p className="text-xs text-[var(--ink-muted)]">
                {t("quotes.builder.measurements_pick_person")}
              </p>
            ) : personSets.length === 0 ? (
              <div className="space-y-1">
                <p className="text-xs text-[var(--ink-muted)]">
                  {t("quotes.builder.measurements_incomplete", {
                    name: personName ?? t("quotes.builder.this_person"),
                  })}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setMeasureModal({
                      jobIndex: i,
                      personId: job.person_id,
                      personName: personName ?? "",
                    })
                  }
                  className="text-xs font-semibold text-[var(--primary)]"
                >
                  {t("quotes.builder.measurements_first_set")}
                </button>
              </div>
            ) : (
              <>
                <select
                  value={job.measurement_set_id}
                  onChange={(e) => updateJob(i, { measurement_set_id: e.target.value })}
                  className={`${inputClass} h-10`}
                >
                  <option value="">
                    {t("quotes.builder.measurements_none")}
                  </option>
                  {personSets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {(s.label || formatDate(s.recorded_at, locale)) +
                        " · " +
                        formatDate(s.recorded_at, locale)}
                    </option>
                  ))}
                </select>

                {selectedSet && (
                  <div className="mt-2">
                    {isStale && (
                      <p className="mb-2 rounded-[4px] bg-[var(--warning-bg)] px-2 py-1 text-[11px] text-[var(--warning)]">
                        {t("quotes.builder.measurements_stale", { months: months || 1 })}
                      </p>
                    )}
                    <dl className="flex flex-wrap gap-1.5">
                      {selectedSet.values.map((v, vi) => (
                        <div
                          key={vi}
                          className="rounded-[4px] bg-[var(--surface)] px-2 py-1 text-[11px]"
                        >
                          <span className="text-[var(--ink-muted)]">
                            {measurementFieldLabel(locale, v.name)}{" "}
                          </span>
                          <span className="metric font-semibold">
                            {formatMeasurement(v.value, v.unit, locale)}
                          </span>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-1.5 text-[11px] text-[var(--ink-muted)]">
                      {t("quotes.builder.measurements_snapshot_hint")}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <label className="mt-3 block text-sm font-semibold">
            {t("quotes.builder.garment_type")}
            <input
              value={job.garment_type}
              onChange={(e) => updateJob(i, { garment_type: e.target.value })}
              placeholder={t("quotes.builder.garment_type_placeholder")}
              aria-label={t("quotes.builder.garment_type")}
              className={inputClass}
            />
          </label>
          <label className="mt-3 block text-sm font-semibold">
            {t("common.description")}
            <textarea
              rows={2}
              value={job.garment_description}
              onChange={(e) => updateJob(i, { garment_description: e.target.value })}
              placeholder={t("quotes.builder.description_placeholder")}
              aria-label={t("common.description")}
              className={`${inputClass} h-auto min-h-[64px] py-2`}
            />
          </label>
          <label className="mt-3 block text-sm font-semibold">
            {t("quotes.builder.job_notes")}
            <textarea
              rows={2}
              value={job.notes}
              onChange={(e) => updateJob(i, { notes: e.target.value })}
              placeholder={t("quotes.builder.job_notes_placeholder")}
              aria-label={t("quotes.builder.job_notes")}
              className={`${inputClass} h-auto min-h-[64px] py-2`}
            />
          </label>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">
              {t("quotes.builder.labor")}
              <select
                value={job.labor_method}
                onChange={(e) =>
                  updateJob(i, { labor_method: e.target.value as LaborMethod })
                }
                className={inputClass}
              >
                <option value="fixed">{t("quotes.builder.labor_fixed")}</option>
                <option value="hourly">{t("quotes.builder.labor_hourly")}</option>
              </select>
            </label>
            {job.labor_method === "fixed" ? (
              <label className="block text-sm font-semibold">
                {t("quotes.builder.labor_fixed")}
                <input
                  type="number"
                  value={job.labor_fixed_price}
                  onChange={(e) => updateJob(i, { labor_fixed_price: e.target.value })}
                  className={inputClass}
                />
              </label>
            ) : (
              <label className="block text-sm font-semibold">
                {t("quotes.builder.estimated_minutes")}
                <input
                  type="number"
                  value={job.estimated_minutes}
                  onChange={(e) => updateJob(i, { estimated_minutes: e.target.value })}
                  className={inputClass}
                />
              </label>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">
              {t("quotes.builder.complexity")}
              <select
                value={job.complexity}
                onChange={(e) => updateJob(i, { complexity: e.target.value as Complexity })}
                className={inputClass}
              >
                <option value="low">{complexityLabel(locale, "low")}</option>
                <option value="medium">{complexityLabel(locale, "medium")}</option>
                <option value="high">{complexityLabel(locale, "high")}</option>
                <option value="very_high">{complexityLabel(locale, "very_high")}</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              {t("quotes.builder.urgency")}
              <select
                value={job.urgency}
                onChange={(e) => updateJob(i, { urgency: e.target.value as Urgency })}
                className={inputClass}
              >
                <option value="normal">{urgencyLabel(locale, "normal")}</option>
                <option value="urgent">{urgencyLabel(locale, "urgent")}</option>
                <option value="very_urgent">{urgencyLabel(locale, "very_urgent")}</option>
              </select>
            </label>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase text-[var(--ink-muted)]">
              {t("catalog.services")}
            </p>
            {job.services.map((s, si) => (
              <div key={si} className="mb-2 grid grid-cols-[1fr_72px_40px] gap-2">
                <select
                  value={s.service_id}
                  onChange={(e) => {
                    const next = [...job.services];
                    next[si] = { ...s, service_id: e.target.value };
                    updateJob(i, { services: next });
                  }}
                  aria-label={t("catalog.services")}
                  className="h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                >
                  <option value="">{t("quotes.builder.service_pick")}</option>
                  {services
                    .filter((sv) => sv.active !== false)
                    .map((sv) => (
                      <option key={sv.id} value={sv.id}>
                        {sv.name}
                        {sv.base_price != null
                          ? ` · ${formatMoney(sv.base_price, currency, locale)}`
                          : ""}
                      </option>
                    ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={s.quantity}
                  onChange={(e) => {
                    const next = [...job.services];
                    next[si] = { ...s, quantity: e.target.value };
                    updateJob(i, { services: next });
                  }}
                  aria-label={t("common.quantity")}
                  className="h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateJob(i, { services: job.services.filter((_, x) => x !== si) })
                  }
                  className="text-xs text-[var(--error)]"
                  aria-label={t("quotes.builder.remove_service")}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                updateJob(i, {
                  services: [...job.services, { service_id: "", quantity: "1" }],
                })
              }
              className="text-xs font-semibold text-[var(--primary)]"
            >
              {t("quotes.builder.add_service")}
            </button>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase text-[var(--ink-muted)]">
              {t("catalog.materials")}
            </p>
            {job.materials.map((m, mi) => (
              <div key={mi} className="mb-2 grid grid-cols-[1fr_64px_64px_40px] gap-2">
                <select
                  value={m.material_id}
                  onChange={(e) => {
                    const next = [...job.materials];
                    next[mi] = { ...m, material_id: e.target.value };
                    updateJob(i, { materials: next });
                  }}
                  aria-label={t("catalog.materials")}
                  className="h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                >
                  <option value="">{t("quotes.builder.material_pick")}</option>
                  {materials.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} ({mat.unit})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={m.quantity}
                  onChange={(e) => {
                    const next = [...job.materials];
                    next[mi] = { ...m, quantity: e.target.value };
                    updateJob(i, { materials: next });
                  }}
                  aria-label={t("common.quantity")}
                  className="h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  value={m.waste_percent}
                  placeholder="%"
                  onChange={(e) => {
                    const next = [...job.materials];
                    next[mi] = { ...m, waste_percent: e.target.value };
                    updateJob(i, { materials: next });
                  }}
                  aria-label={t("quotes.builder.waste_percent")}
                  className="h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateJob(i, { materials: job.materials.filter((_, x) => x !== mi) })
                  }
                  className="text-xs text-[var(--error)]"
                  aria-label={t("quotes.builder.remove_material")}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                updateJob(i, {
                  materials: [
                    ...job.materials,
                    {
                      material_id: "",
                      quantity: "1",
                      waste_percent: String(config.defaultWastePercent),
                    },
                  ],
                })
              }
              className="text-xs font-semibold text-[var(--primary)]"
            >
              {t("quotes.builder.add_material")}
            </button>
          </div>

          <label className="mt-4 block text-sm font-semibold">
            {t("quotes.builder.other_costs")}
            <input
              type="number"
              value={job.other_costs}
              onChange={(e) => updateJob(i, { other_costs: e.target.value })}
              className={inputClass}
            />
          </label>
        </Card>
        );
      })}

      <button
        type="button"
        onClick={() => setJobs([...jobs, emptyJob()])}
        className="h-11 w-full rounded-[6px] border border-dashed border-[var(--primary)] text-sm font-semibold text-[var(--primary)]"
      >
        {t("quotes.builder.add_work")}
      </button>

      {preview && (
        <Card className="bg-[var(--surface-2)] p-4">
          <SectionTitle>{t("quotes.builder.estimate_title")}</SectionTitle>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>{t("quotes.builder.estimate_material")}</dt>
              <dd className="metric">{formatMoney(preview.materials, currency, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t("quotes.builder.estimate_labor")}</dt>
              <dd className="metric">{formatMoney(preview.labor, currency, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t("quotes.builder.complexity")}</dt>
              <dd className="metric">{formatMoney(preview.complexity, currency, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t("quotes.builder.urgency")}</dt>
              <dd className="metric">{formatMoney(preview.urgency, currency, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t("quotes.builder.margin")}</dt>
              <dd className="metric">{formatMoney(preview.margin, currency, locale)}</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-[var(--border)] pt-2 font-semibold">
              <dt>{t("quotes.builder.total")}</dt>
              <dd className="metric text-[var(--primary)]">
                {formatMoney(preview.suggestedPrice, currency, locale)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] text-[var(--ink-muted)]">
            {t("quotes.builder.estimate_hint")}
          </p>
        </Card>
      )}

      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={submit}
        loading={pending}
      >
        {initial?.id ? t("common.save") : t("quotes.builder.save_draft")}
      </Button>
      {initial?.id && (
        <button
          type="button"
          onClick={() => router.push(`/quotes/${initial.id}` as Route)}
          className="w-full text-center text-sm font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          {t("quotes.builder.back_to_quote")}
        </button>
      )}
    </div>
  );
}
