"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/session";

export type ActionResult = {
  ok: boolean;
  message: string;
};

function ok(message: string): ActionResult {
  return { ok: true, message };
}

function fail(message: string): ActionResult {
  return { ok: false, message };
}

export async function createServiceAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await requireSessionContext();
    const supabase = await createClient();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return fail("El nombre es obligatorio");

    const basePrice = formData.get("base_price");
    const minutes = formData.get("estimated_minutes");

    const { data: dup } = await supabase
      .from("services")
      .select("id")
      .eq("tenant_id", ctx.tenantId)
      .ilike("name", name)
      .maybeSingle();
    if (dup) return fail("Ya existe un servicio con ese nombre");

    const { error } = await supabase.from("services").insert({
      tenant_id: ctx.tenantId,
      name,
      category: String(formData.get("category") ?? "").trim() || null,
      base_price:
        basePrice !== null && basePrice !== "" ? Number(basePrice) : null,
      estimated_minutes:
        minutes !== null && minutes !== "" ? Number(minutes) : null,
      unit: String(formData.get("unit") ?? "").trim() || null,
    });
    if (error) return fail(error.message);

    revalidatePath("/catalog");
    return ok(`Servicio “${name}” guardado`);
  } catch {
    return fail("No se pudo guardar el servicio");
  }
}

export async function toggleServiceAction(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    const ctx = await requireSessionContext();
    const supabase = await createClient();
    const { error } = await supabase
      .from("services")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);
    if (error) return fail(error.message);
    revalidatePath("/catalog");
    return ok(active ? "Servicio activado" : "Servicio desactivado");
  } catch {
    return fail("No se pudo actualizar el servicio");
  }
}

export async function createMaterialAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await requireSessionContext();
    const supabase = await createClient();
    const name = String(formData.get("name") ?? "").trim();
    const unit = String(formData.get("unit") ?? "").trim() || "m";
    if (!name) return fail("El nombre es obligatorio");

    const { data: dup } = await supabase
      .from("materials")
      .select("id")
      .eq("tenant_id", ctx.tenantId)
      .ilike("name", name)
      .maybeSingle();
    if (dup) return fail("Ya existe un material con ese nombre");

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
    if (error) return fail(error.message);

    const price = formData.get("unit_price");
    if (price !== null && price !== "" && Number(price) >= 0) {
      const { error: pErr } = await supabase.from("material_prices").insert({
        tenant_id: ctx.tenantId,
        material_id: material.id,
        unit_price: Number(price),
        currency: ctx.currency,
        valid_from: new Date().toISOString().slice(0, 10),
      });
      if (pErr) return fail(pErr.message);
    }

    revalidatePath("/catalog");
    return ok(`Material “${name}” guardado`);
  } catch {
    return fail("No se pudo guardar el material");
  }
}

export async function upsertMaterialPriceAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await requireSessionContext();
    const supabase = await createClient();
    const materialId = String(formData.get("material_id") ?? "");
    const unitPrice = Number(formData.get("unit_price"));
    const validFrom =
      String(formData.get("valid_from") ?? "") ||
      new Date().toISOString().slice(0, 10);
    if (!materialId || !Number.isFinite(unitPrice) || unitPrice < 0) {
      return fail("Precio no válido");
    }

    const { error } = await supabase.from("material_prices").insert({
      tenant_id: ctx.tenantId,
      material_id: materialId,
      unit_price: unitPrice,
      currency: ctx.currency,
      valid_from: validFrom,
    });
    if (error) return fail(error.message);

    revalidatePath("/catalog");
    return ok("Precio actualizado (historial conservado)");
  } catch {
    return fail("No se pudo actualizar el precio");
  }
}

export async function createJobCategoryAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await requireSessionContext();
    const supabase = await createClient();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return fail("El nombre es obligatorio");

    const { data: dup } = await supabase
      .from("job_categories")
      .select("id")
      .eq("tenant_id", ctx.tenantId)
      .ilike("name", name)
      .maybeSingle();
    if (dup) return fail("Ya existe esa categoría");

    const { error } = await supabase
      .from("job_categories")
      .insert({ tenant_id: ctx.tenantId, name });
    if (error) return fail(error.message);

    revalidatePath("/catalog");
    return ok(`Categoría “${name}” guardada`);
  } catch {
    return fail("No se pudo guardar la categoría");
  }
}

export async function toggleJobCategoryAction(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    const ctx = await requireSessionContext();
    const supabase = await createClient();
    const { error } = await supabase
      .from("job_categories")
      .update({ active })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);
    if (error) return fail(error.message);
    revalidatePath("/catalog");
    return ok(active ? "Categoría activada" : "Categoría desactivada");
  } catch {
    return fail("No se pudo actualizar la categoría");
  }
}

export async function toggleMaterialAction(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    const ctx = await requireSessionContext();
    const supabase = await createClient();
    const { error } = await supabase
      .from("materials")
      .update({ active })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);
    if (error) return fail(error.message);
    revalidatePath("/catalog");
    return ok(active ? "Material activado" : "Material desactivado");
  } catch {
    return fail("No se pudo actualizar el material");
  }
}
