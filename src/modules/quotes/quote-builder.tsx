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
import { formatMoney, type Locale } from "@/lib/i18n";
import { saveQuoteDraftAction } from "@/modules/quotes/actions";
import { Button, Card, SectionTitle, inputClass } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

type ClientOpt = { id: string; name: string };
type PersonOpt = { id: string; name: string; client_id: string | null };
type ServiceOpt = { id: string; name: string; base_price: number | null; estimated_minutes: number | null; active?: boolean };
type MaterialOpt = { id: string; name: string; unit: string; unit_price: number };
type CategoryOpt = { id: string; name: string };

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

export function QuoteBuilder({
  clients,
  persons,
  services,
  materials,
  categories,
  config,
  currency,
  locale,
  presetClientId,
}: {
  clients: ClientOpt[];
  persons: PersonOpt[];
  services: ServiceOpt[];
  materials: MaterialOpt[];
  categories: CategoryOpt[];
  config: TenantPricingConfig;
  currency: string;
  locale: Locale;
  presetClientId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [clientId, setClientId] = useState(presetClientId ?? "");
  const [margin, setMargin] = useState(String(config.defaultMarginPercent));
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");
  const [jobs, setJobs] = useState<JobLine[]>([emptyJob()]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientPersons = useMemo(
    () => persons.filter((p) => !clientId || !p.client_id || p.client_id === clientId),
    [persons, clientId],
  );

  function updateJob(i: number, patch: Partial<JobLine>) {
    setJobs((prev) => prev.map((j, idx) => (idx === i ? { ...j, ...patch } : j)));
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
      if (!clientId) throw new Error("Selecciona un cliente");
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
      await saveQuoteDraftAction(JSON.stringify(payload));
      toast("Borrador guardado", "success");
      router.push("/quotes" as Route);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar";
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

      <Card className="p-4">
        <SectionTitle>Cliente</SectionTitle>
        <label className="block text-sm font-semibold">
          Cliente *
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Seleccionar…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            Margen %
            <input
              type="number"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            Válido hasta
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <label className="mt-3 block text-sm font-semibold">
          Notas del presupuesto
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
className="mt-1 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none"
        />
        </label>
      </Card>

      {jobs.map((job, i) => (
        <Card
          key={i}
          className="p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle>Trabajo {i + 1}</SectionTitle>
            {jobs.length > 1 && (
              <button
                type="button"
                onClick={() => setJobs(jobs.filter((_, idx) => idx !== i))}
                className="text-xs font-semibold text-[var(--error)]"
              >
                Quitar
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">
              Categoría
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
            <label className="block text-sm font-semibold">
              Persona destinataria
              <select
                value={job.person_id}
                onChange={(e) => updateJob(i, { person_id: e.target.value })}
                className={inputClass}
              >
                <option value="">—</option>
                {clientPersons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-3 block text-sm font-semibold">
            Tipo de prenda
            <input
              value={job.garment_type}
              onChange={(e) => updateJob(i, { garment_type: e.target.value })}
              placeholder="ej: vestido de fiesta"
              className={inputClass}
            />
          </label>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">
              Mano de obra
              <select
                value={job.labor_method}
                onChange={(e) =>
                  updateJob(i, { labor_method: e.target.value as LaborMethod })
                }
                className={inputClass}
              >
                <option value="fixed">Precio fijo</option>
                <option value="hourly">Por hora</option>
              </select>
            </label>
            {job.labor_method === "fixed" ? (
              <label className="block text-sm font-semibold">
                Precio fijo
                <input
                  type="number"
                  value={job.labor_fixed_price}
                  onChange={(e) => updateJob(i, { labor_fixed_price: e.target.value })}
                  className={inputClass}
                />
              </label>
            ) : (
              <label className="block text-sm font-semibold">
                Minutos estimados
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
              Complejidad
              <select
                value={job.complexity}
                onChange={(e) => updateJob(i, { complexity: e.target.value as Complexity })}
                className={inputClass}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="very_high">Muy alta</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Urgencia
              <select
                value={job.urgency}
                onChange={(e) => updateJob(i, { urgency: e.target.value as Urgency })}
                className={inputClass}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgente</option>
                <option value="very_urgent">Muy urgente</option>
              </select>
            </label>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase text-[var(--ink-muted)]">
              Servicios
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
                  className="h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                >
                  <option value="">Servicio…</option>
                  {services
                    .filter((sv) => sv.active !== false)
                    .map((sv) => (
                      <option key={sv.id} value={sv.id}>
                        {sv.name}
                        {sv.base_price != null ? ` · ${sv.base_price}` : ""}
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
                  className="h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateJob(i, { services: job.services.filter((_, x) => x !== si) })
                  }
                  className="text-xs text-[var(--error)]"
                  aria-label="Quitar servicio"
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
              + Servicio
            </button>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase text-[var(--ink-muted)]">
              Materiales
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
                  className="h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                >
                  <option value="">Material…</option>
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
                  className="h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateJob(i, { materials: job.materials.filter((_, x) => x !== mi) })
                  }
                  className="text-xs text-[var(--error)]"
                  aria-label="Quitar material"
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
              + Material
            </button>
          </div>

          <label className="mt-4 block text-sm font-semibold">
            Otros costos
            <input
              type="number"
              value={job.other_costs}
              onChange={(e) => updateJob(i, { other_costs: e.target.value })}
              className={inputClass}
            />
          </label>
        </Card>
      ))}

      <button
        type="button"
        onClick={() => setJobs([...jobs, emptyJob()])}
        className="h-11 w-full rounded-[6px] border border-dashed border-[var(--primary)] text-sm font-semibold text-[var(--primary)]"
      >
        + Agregar trabajo
      </button>

      {preview && (
        <Card className="bg-[var(--surface-2)] p-4">
          <SectionTitle>Desglose (preview)</SectionTitle>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Materiales</dt>
              <dd className="metric">{formatMoney(preview.materials, currency, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Mano de obra</dt>
              <dd className="metric">{formatMoney(preview.labor, currency, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Complejidad</dt>
              <dd className="metric">{formatMoney(preview.complexity, currency, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Urgencia</dt>
              <dd className="metric">{formatMoney(preview.urgency, currency, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Margen</dt>
              <dd className="metric">{formatMoney(preview.margin, currency, locale)}</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-[var(--border)] pt-2 font-semibold">
              <dt>Precio sugerido</dt>
              <dd className="metric text-[var(--primary)]">
                {formatMoney(preview.suggestedPrice, currency, locale)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] text-[var(--ink-muted)]">
            El servidor recalculará y congelará snapshots al guardar.
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
        Guardar borrador
      </Button>
    </div>
  );
}
