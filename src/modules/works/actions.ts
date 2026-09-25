"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/session";

const TRANSITIONS: Record<string, string[]> = {
  accepted: ["waiting_garment", "in_production", "cancelled"],
  waiting_garment: ["in_production", "cancelled"],
  in_production: ["fitting", "adjustments", "ready", "cancelled"],
  fitting: ["adjustments", "ready", "in_production", "cancelled"],
  adjustments: ["fitting", "ready", "in_production", "cancelled"],
  ready: ["delivered", "adjustments"],
  delivered: [],
  cancelled: [],
};

export async function convertQuoteToWorkOrderAction(quoteId: string) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, status, version_number, final_price, suggested_price")
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId)
    .single();
  if (!quote) throw new Error("Quote not found");
  if (quote.status !== "accepted") throw new Error("Only accepted quotes convert");

  const { data: active } = await supabase
    .from("work_orders")
    .select("id")
    .eq("quote_id", quoteId)
    .eq("tenant_id", ctx.tenantId)
    .neq("status", "cancelled")
    .maybeSingle();
  if (active) {
    throw new Error("Este presupuesto ya tiene una orden de trabajo");
  }

  const { data: jobs } = await supabase
    .from("quote_jobs")
    .select("id, measurements_snapshot, sort_order")
    .eq("quote_id", quoteId)
    .eq("tenant_id", ctx.tenantId);
  const quoteJobs = (jobs ?? []) as {
    id: string;
    measurements_snapshot: unknown;
    sort_order: number | null;
  }[];

  const { data: wo, error } = await supabase
    .from("work_orders")
    .insert({
      tenant_id: ctx.tenantId,
      quote_id: quoteId,
      quote_version_number: quote.version_number,
      status: "accepted",
      actual_price: quote.final_price ?? quote.suggested_price,
      measurements_snapshot: quoteJobs.find((j) => j.measurements_snapshot)
        ?.measurements_snapshot ?? null,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      throw new Error("Este presupuesto ya tiene una orden de trabajo");
    }
    throw new Error(error.message);
  }

  if (quoteJobs.length) {
    const { error: itemErr } = await supabase.from("work_order_items").insert(
      quoteJobs.map((j) => ({
        tenant_id: ctx.tenantId,
        work_order_id: wo.id,
        quote_job_id: j.id,
        status: "accepted",
        measurements_snapshot: j.measurements_snapshot,
        sort_order: j.sort_order ?? 0,
      })),
    );
    if (itemErr) throw new Error(itemErr.message);
  }

  revalidatePath("/works");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function transitionWorkOrderAction(
  workId: string,
  nextStatus: string,
) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const { data: wo } = await supabase
    .from("work_orders")
    .select("id, status")
    .eq("id", workId)
    .eq("tenant_id", ctx.tenantId)
    .single();
  if (!wo) throw new Error("Work order not found");

  const allowed = TRANSITIONS[wo.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Invalid transition ${wo.status} → ${nextStatus}`);
  }

  const patch: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };
  if (nextStatus === "in_production" && !wo.status.startsWith("in_")) {
    patch.started_at = new Date().toISOString();
  }
  if (nextStatus === "delivered") {
    patch.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("work_orders")
    .update(patch)
    .eq("id", workId)
    .eq("tenant_id", ctx.tenantId);
  if (error) throw new Error(error.message);

  revalidatePath("/works");
  revalidatePath(`/works/${workId}`);
}

export async function updateWorkOrderMetaAction(
  workId: string,
  formData: FormData,
) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const actualMinutes = formData.get("actual_minutes");
  const actualPrice = formData.get("actual_price");
  const notes = String(formData.get("notes") ?? "").trim();

  const patch: Record<string, unknown> = {
    notes: notes || null,
    updated_at: new Date().toISOString(),
  };
  if (actualMinutes !== null && actualMinutes !== "") {
    patch.actual_minutes = Number(actualMinutes);
  }
  if (actualPrice !== null && actualPrice !== "") {
    patch.actual_price = Number(actualPrice);
  }

  const { error } = await supabase
    .from("work_orders")
    .update(patch)
    .eq("id", workId)
    .eq("tenant_id", ctx.tenantId)
    .not("status", "in", ["delivered", "cancelled"]);
  if (error) throw new Error(error.message);

  revalidatePath(`/works/${workId}`);
}
