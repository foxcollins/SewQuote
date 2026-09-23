"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/session";

export async function createServiceAction(formData: FormData) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name required");

  const { error } = await supabase.from("services").insert({
    tenant_id: ctx.tenantId,
    name,
    category: String(formData.get("category") ?? "").trim() || null,
    base_price: formData.get("base_price")
      ? Number(formData.get("base_price"))
      : null,
    estimated_minutes: formData.get("estimated_minutes")
      ? Number(formData.get("estimated_minutes"))
      : null,
    unit: String(formData.get("unit") ?? "").trim() || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/catalog");
}

export async function toggleServiceAction(id: string, active: boolean) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  if (error) throw new Error(error.message);
  revalidatePath("/catalog");
}

export async function createMaterialAction(formData: FormData) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim() || "m";
  if (!name) throw new Error("Name required");

  const { data: material, error } = await supabase
    .from("materials")
    .insert({
      tenant_id: ctx.tenantId,
      name,
      category: String(formData.get("category") ?? "").trim() || null,
      unit,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const price = formData.get("unit_price");
  if (price !== null && price !== "" && Number(price) >= 0) {
    const { error: pErr } = await supabase.from("material_prices").insert({
      tenant_id: ctx.tenantId,
      material_id: material.id,
      unit_price: Number(price),
      currency: ctx.currency,
      valid_from: new Date().toISOString().slice(0, 10),
    });
    if (pErr) throw new Error(pErr.message);
  }

  revalidatePath("/catalog");
}

export async function upsertMaterialPriceAction(formData: FormData) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const materialId = String(formData.get("material_id") ?? "");
  const unitPrice = Number(formData.get("unit_price"));
  const validFrom =
    String(formData.get("valid_from") ?? "") ||
    new Date().toISOString().slice(0, 10);
  if (!materialId || !Number.isFinite(unitPrice)) throw new Error("Invalid price");

  const { error } = await supabase.from("material_prices").insert({
    tenant_id: ctx.tenantId,
    material_id: materialId,
    unit_price: unitPrice,
    currency: ctx.currency,
    valid_from: validFrom,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/catalog");
}

export async function createJobCategoryAction(formData: FormData) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name required");
  const { error } = await supabase
    .from("job_categories")
    .insert({ tenant_id: ctx.tenantId, name });
  if (error) throw new Error(error.message);
  revalidatePath("/catalog");
}

export async function toggleJobCategoryAction(id: string, active: boolean) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("job_categories")
    .update({ active })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  if (error) throw new Error(error.message);
  revalidatePath("/catalog");
}
