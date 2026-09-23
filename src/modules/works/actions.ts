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
    .select("id, status, version_number, final_price, suggested_price, quote_jobs(measurements_snapshot)")
    .eq("id", quoteId)
    .eq("tenant_id", ctx.tenantId)
    .single();
  if (!quote) throw new Error("Quote not found");
  if (quote.status !== "accepted") throw new Error("Only accepted quotes convert");

  const snapshot =
    (quote.quote_jobs as { measurements_snapshot?: unknown }[] | null)?.find(
      (j) => j.measurements_snapshot,
    )?.measurements_snapshot ?? null;

  const { error } = await supabase.from("work_orders").insert({
    tenant_id: ctx.tenantId,
    quote_id: quoteId,
    quote_version_number: quote.version_number,
    status: "accepted",
    actual_price: quote.final_price ?? quote.suggested_price,
    measurements_snapshot: snapshot,
  });
  if (error) throw new Error(error.message);

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
