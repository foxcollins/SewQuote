"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/session";
import {
  calculateQuote,
  type Complexity,
  type LaborMethod,
  type QuoteJobInput,
  type TenantPricingConfig,
  type Urgency,
} from "@/modules/pricing/engine";

type JobDraft = {
  job_category_id?: string | null;
  person_id?: string | null;
  garment_type?: string;
  garment_description?: string;
  labor_method: LaborMethod;
  labor_fixed_price?: number | null;
  estimated_minutes?: number | null;
  complexity: Complexity;
  urgency: Urgency;
  measurement_set_id?: string | null;
  notes?: string;
  services: { service_id: string; quantity: number }[];
  materials: { material_id: string; quantity: number; waste_percent?: number }[];
  other_costs?: number;
};

type QuoteDraftPayload = {
  client_id: string;
  margin_percent?: number | null;
  other_costs?: number;
  valid_until?: string;
  notes?: string;
  jobs: JobDraft[];
};

function pricingConfigFromCtx(ctx: Awaited<ReturnType<typeof requireSessionContext>>): TenantPricingConfig {
  return {
    hourlyRate: ctx.hourlyRate,
    defaultMarginPercent: ctx.defaultMarginPercent,
    defaultWastePercent: ctx.defaultWastePercent,
    complexityFactors: ctx.complexityFactors as TenantPricingConfig["complexityFactors"],
    urgencyFactors: ctx.urgencyFactors as TenantPricingConfig["urgencyFactors"],
  };
}

async function nextQuoteNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
): Promise<number> {
  const { data } = await supabase
    .from("quotes")
    .select("quote_number")
    .eq("tenant_id", tenantId)
    .order("quote_number", { ascending: false })
    .limit(1);
  return ((data?.[0]?.quote_number as number | undefined) ?? 0) + 1;
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function saveQuoteDraftAction(payloadJson: string) {
  const ctx = await requireSessionContext();
  const payload = JSON.parse(payloadJson) as QuoteDraftPayload;
  if (!payload.client_id) throw new Error("client required");
  if (!payload.jobs?.length) throw new Error("jobs required");

  const supabase = await createClient();
  const config = pricingConfigFromCtx(ctx);
  const margin =
    payload.margin_percent !== undefined && payload.margin_percent !== null
      ? Number(payload.margin_percent)
      : undefined;

  // Resolve materials + measurements snapshots server-side
  const materialIds = [
    ...new Set(payload.jobs.flatMap((j) => j.materials.map((m) => m.material_id))),
  ];
  const serviceIds = [
    ...new Set(payload.jobs.flatMap((j) => j.services.map((s) => s.service_id))),
  ];
  const setIds = [
    ...new Set(
      payload.jobs.map((j) => j.measurement_set_id).filter(Boolean) as string[],
    ),
  ];

  const [matRes, svcRes, setRes] = await Promise.all([
    materialIds.length
      ? supabase
          .from("materials")
          .select("id, name, unit, active, material_prices(unit_price, valid_from, currency)")
          .in("id", materialIds)
      : Promise.resolve({ data: [] as never[] }),
    serviceIds.length
      ? supabase
          .from("services")
          .select("id, name, base_price, estimated_minutes, category")
          .in("id", serviceIds)
      : Promise.resolve({ data: [] as never[] }),
    setIds.length
      ? supabase
          .from("measurement_sets")
          .select(
            "id, person_id, recorded_at, label, measurement_values(name, value, unit)",
          )
          .in("id", setIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  type MaterialRow = {
    id: string;
    name: string;
    unit: string;
    material_prices: {
      unit_price: number;
      valid_from: string;
      currency: string;
    }[];
  };
  type ServiceRow = {
    id: string;
    name: string;
    base_price: number | null;
    estimated_minutes: number | null;
    category: string | null;
  };
  type SetRow = {
    id: string;
    person_id: string;
    recorded_at: string;
    label: string | null;
    measurement_values: { name: string; value: number; unit: string }[];
  };

  const materials = (matRes.data ?? []) as MaterialRow[];
  const services = (svcRes.data ?? []) as ServiceRow[];
  const sets = (setRes.data ?? []) as SetRow[];

  const materialMap = new Map(materials.map((m) => [m.id, m]));
  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const setMap = new Map(sets.map((s) => [s.id, s]));

  function currentPrice(m: MaterialRow): number {
    const today = new Date().toISOString().slice(0, 10);
    const applicable = (m.material_prices ?? [])
      .filter((p) => p.valid_from <= today)
      .sort((a, b) => (a.valid_from < b.valid_from ? 1 : -1));
    return Number(applicable[0]?.unit_price ?? 0);
  }

  const engineJobs: QuoteJobInput[] = payload.jobs.map((job) => ({
    laborMethod: job.labor_method,
    laborFixedPrice: job.labor_fixed_price ?? undefined,
    estimatedMinutes: job.estimated_minutes ?? undefined,
    complexity: job.complexity,
    urgency: job.urgency,
    materials: job.materials.map((m) => {
      const mat = materialMap.get(m.material_id);
      if (!mat) throw new Error("material not found or other tenant");
      return { quantity: Number(m.quantity), unitPrice: currentPrice(mat) };
    }),
    otherCosts: job.other_costs ?? 0,
  }));

  const breakdown = calculateQuote(
    { jobs: engineJobs, marginPercent: margin },
    config,
  );
  const otherCosts = round2(
    payload.jobs.reduce((a, j) => a + (j.other_costs ?? 0), 0),
  );

  const quoteNumber = await nextQuoteNumber(supabase, ctx.tenantId);

  const { data: quote, error: qErr } = await supabase
    .from("quotes")
    .insert({
      tenant_id: ctx.tenantId,
      client_id: payload.client_id,
      quote_number: quoteNumber,
      status: "draft",
      version_number: 0,
      margin_percent: margin ?? null,
      currency: ctx.currency,
      subtotal_materials: breakdown.materials,
      subtotal_labor: breakdown.labor,
      complexity_amount: breakdown.complexity,
      urgency_amount: breakdown.urgency,
      other_costs_amount: otherCosts,
      margin_amount: breakdown.margin,
      suggested_price: round2(breakdown.suggestedPrice + otherCosts),
      final_price: null,
      valid_until: payload.valid_until || defaultValidUntil(),
      notes: payload.notes || null,
    })
    .select("id")
    .single();
  if (qErr) throw new Error(qErr.message);

  for (let i = 0; i < payload.jobs.length; i++) {
    const job = payload.jobs[i];
    const set = job.measurement_set_id
      ? setMap.get(job.measurement_set_id)
      : null;
    const snapshot = set
      ? {
          recorded_at: set.recorded_at,
          label: set.label,
          source_id: set.id,
          values: set.measurement_values,
        }
      : null;

    const { data: jobRow, error: jErr } = await supabase
      .from("quote_jobs")
      .insert({
        tenant_id: ctx.tenantId,
        quote_id: quote.id,
        job_category_id: job.job_category_id || null,
        person_id: job.person_id || null,
        garment_type: job.garment_type || null,
        garment_description: job.garment_description || null,
        labor_method: job.labor_method,
        labor_fixed_price: job.labor_fixed_price ?? null,
        estimated_minutes: job.estimated_minutes ?? null,
        complexity: job.complexity,
        urgency: job.urgency,
        measurements_snapshot: snapshot,
        measurements_source_id: set?.id ?? null,
        notes: job.notes || null,
        sort_order: i,
      })
      .select("id")
      .single();
    if (jErr) throw new Error(jErr.message);

    const itemRows = job.services
      .flatMap((s) => {
        const svc = serviceMap.get(s.service_id);
        if (!svc) return [];
        const unitPrice = Number(svc.base_price ?? 0);
        const qty = Number(s.quantity);
        return [{
          tenant_id: ctx.tenantId,
          quote_job_id: jobRow.id,
          service_id: svc.id,
          description_snapshot: svc.name,
          quantity: qty,
          estimated_minutes: svc.estimated_minutes,
          unit_price_snapshot: unitPrice,
          total: round2(unitPrice * qty),
        }];
      });
    if (itemRows.length) {
      const { error } = await supabase.from("quote_items").insert(itemRows);
      if (error) throw new Error(error.message);
    }

    const matRows = job.materials.map((m) => {
      const mat = materialMap.get(m.material_id);
      if (!mat) throw new Error("material missing");
      const waste = Number(
        m.waste_percent ?? ctx.defaultWastePercent ?? 0,
      );
      const unitPrice = currentPrice(mat);
      const qty = Number(m.quantity);
      const total = round2(qty * unitPrice * (1 + waste / 100));
      return {
        tenant_id: ctx.tenantId,
        quote_job_id: jobRow.id,
        material_id: mat.id,
        material_name_snapshot: mat.name,
        quantity: qty,
        unit_snapshot: mat.unit,
        unit_price_snapshot: unitPrice,
        waste_percent: waste,
        total,
      };
    });
    if (matRows.length) {
      const { error } = await supabase.from("quote_materials").insert(matRows);
      if (error) throw new Error(error.message);
    }
  }

  revalidatePath("/quotes");
  redirect((`/quotes/${quote.id}`) as never);
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function defaultValidUntil(days = 15) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function sendQuoteAction(quoteId: string) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId)
    .single();
  if (error || !quote) throw new Error("Quote not found");
  if (quote.status !== "draft") throw new Error("Only draft can be sent");

  const token = quote.public_token || randomToken();
  const versionNumber = Number(quote.version_number ?? 0) + 1;

  const { error: uErr } = await supabase
    .from("quotes")
    .update({
      status: "sent",
      version_number: versionNumber,
      public_token: token,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId);
  if (uErr) throw new Error(uErr.message);

  await insertVersion(supabase, ctx.tenantId, quoteId, versionNumber, "sent", quote);
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function acceptQuoteAction(quoteId: string) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId)
    .single();
  if (!quote) throw new Error("Quote not found");
  if (quote.status === "accepted") return;
  if (quote.status !== "sent") throw new Error("Only sent can be accepted");

  const versionNumber = Number(quote.version_number ?? 0) + 1;
  await supabase
    .from("quotes")
    .update({
      status: "accepted",
      version_number: versionNumber,
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId);

  await insertVersion(supabase, ctx.tenantId, quoteId, versionNumber, "accepted", quote);
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function rejectQuoteAction(quoteId: string) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("status")
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId)
    .single();
  if (!quote) throw new Error("Quote not found");
  if (quote.status === "rejected") return;
  if (quote.status !== "sent") throw new Error("Only sent can be rejected");

  await supabase
    .from("quotes")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function cancelQuoteAction(quoteId: string) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();
  await supabase
    .from("quotes")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId)
    .in("status", ["draft", "sent"]);
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function expireQuoteAction(quoteId: string) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();
  await supabase
    .from("quotes")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "sent");
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function recalculateQuoteAfterExpiryAction(quoteId: string) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select(
      "*, quote_jobs(*, quote_materials(*), quote_items(*))",
    )
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId)
    .single();
  if (!quote) throw new Error("Quote not found");
  if (quote.status !== "expired") throw new Error("Only expired can recalculate");

  const config = pricingConfigFromCtx(ctx);
  const jobs = quote.quote_jobs as {
    id: string;
    labor_method: LaborMethod;
    labor_fixed_price: number | null;
    estimated_minutes: number | null;
    complexity: Complexity;
    urgency: Urgency;
    quote_materials: {
      material_id: string | null;
      quantity: number;
      waste_percent: number;
    }[];
  }[];

  const materialIds = [
    ...new Set(
      jobs.flatMap((j) =>
        j.quote_materials.map((m) => m.material_id).filter(Boolean),
      ),
    ),
  ] as string[];

  const { data: mats } = materialIds.length
    ? await supabase
        .from("materials")
        .select("id, name, unit, material_prices(unit_price, valid_from)")
        .in("id", materialIds)
    : { data: [] as never[] };

  const matMap = new Map(
    ((mats ?? []) as {
      id: string;
      name: string;
      unit: string;
      material_prices: { unit_price: number; valid_from: string }[];
    }[]).map((m) => [m.id, m]),
  );

  function priceOf(id: string): number {
    const m = matMap.get(id);
    if (!m) return 0;
    const today = new Date().toISOString().slice(0, 10);
    const list = (m.material_prices ?? [])
      .filter((p) => p.valid_from <= today)
      .sort((a, b) => (a.valid_from < b.valid_from ? 1 : -1));
    return Number(list[0]?.unit_price ?? 0);
  }

  const engineJobs: QuoteJobInput[] = jobs.map((job) => ({
    laborMethod: job.labor_method,
    laborFixedPrice: job.labor_fixed_price ?? undefined,
    estimatedMinutes: job.estimated_minutes ?? undefined,
    complexity: job.complexity,
    urgency: job.urgency,
    materials: job.quote_materials.map((m) => ({
      quantity: Number(m.quantity),
      unitPrice: m.material_id ? priceOf(m.material_id) : 0,
    })),
  }));

  const breakdown = calculateQuote(
    {
      jobs: engineJobs,
      marginPercent:
        quote.margin_percent !== null ? Number(quote.margin_percent) : undefined,
    },
    config,
  );

  // Refresh material snapshots for each job
  for (const job of jobs) {
    for (const m of job.quote_materials) {
      if (!m.material_id) continue;
      const price = priceOf(m.material_id);
      const total = round2(
        Number(m.quantity) * price * (1 + Number(m.waste_percent ?? 0) / 100),
      );
      await supabase
        .from("quote_materials")
        .update({ unit_price_snapshot: price, total })
        .eq("quote_job_id", job.id)
        .eq("material_id", m.material_id);
    }
  }

  const versionNumber = Number(quote.version_number ?? 0) + 1;
  await supabase
    .from("quotes")
    .update({
      status: "sent",
      version_number: versionNumber,
      subtotal_materials: breakdown.materials,
      subtotal_labor: breakdown.labor,
      complexity_amount: breakdown.complexity,
      urgency_amount: breakdown.urgency,
      suggested_price: round2(
        breakdown.suggestedPrice + Number(quote.other_costs_amount ?? 0),
      ),
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId);

  await insertVersion(
    supabase,
    ctx.tenantId,
    quoteId,
    versionNumber,
    "recalculated_after_expiry",
    quote,
  );
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function overrideFinalPriceAction(
  quoteId: string,
  formData: FormData,
) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const finalPrice = Number(formData.get("final_price"));
  const reason = String(formData.get("override_reason") ?? "").trim();
  if (!Number.isFinite(finalPrice)) throw new Error("Invalid price");

  await supabase
    .from("quotes")
    .update({
      final_price: finalPrice,
      override_reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId)
    .in("status", ["draft", "sent"]);

  revalidatePath(`/quotes/${quoteId}`);
}

async function insertVersion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  quoteId: string,
  versionNumber: number,
  reason: "sent" | "accepted" | "recalculated_after_expiry",
  quote: Record<string, unknown>,
) {
  const { data: jobs } = await supabase
    .from("quote_jobs")
    .select("*, quote_items(*), quote_materials(*)")
    .eq("quote_id", quoteId);

  const { error } = await supabase.from("quote_versions").insert({
    tenant_id: tenantId,
    quote_id: quoteId,
    version_number: versionNumber,
    reason,
    suggested_price: quote.suggested_price,
    final_price: quote.final_price,
    payload_snapshot: {
      quote: {
        status: quote.status,
        suggested_price: quote.suggested_price,
        final_price: quote.final_price,
        subtotal_materials: quote.subtotal_materials,
        subtotal_labor: quote.subtotal_labor,
      },
      jobs: jobs ?? [],
    },
  });
  if (error && !error.message.includes("duplicate")) {
    throw new Error(error.message);
  }
}
