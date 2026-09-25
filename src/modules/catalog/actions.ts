"use server";

import { revalidatePath } from "next/cache";
import type { TranslationKey, TranslationVars } from "@/lib/i18n";
import { requireSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = {
  ok: boolean;
  code: TranslationKey | string;
  vars?: TranslationVars;
};

function ok(code: TranslationKey, vars?: TranslationVars): ActionResult {
  return { ok: true, code, vars };
}

function fail(code: TranslationKey, vars?: TranslationVars): ActionResult {
  return { ok: false, code, vars };
}

export async function createServiceAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await requireSessionContext();
    const supabase = await createClient();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return fail("catalog.name_required");

    const basePrice = formData.get("base_price");
    const minutes = formData.get("estimated_minutes");

    const { data: dup } = await supabase
      .from("services")
      .select("id")
      .eq("tenant_id", ctx.tenantId)
      .ilike("name", name)
      .maybeSingle();
    if (dup) return fail("catalog.name_taken");

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
    if (error) return fail("catalog.service_save_failed");

    revalidatePath("/catalog");
    return ok("catalog.service_saved_named", { name });
  } catch {
    return fail("catalog.service_save_failed");
  }
}

export async function toggleServiceAction(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    const ctx = await requireSessionContext();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("services")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId)
      .select("id, active")
      .single();
    if (error) return fail("catalog.service_update_failed");
    if (!data || data.active !== active) {
      return fail("catalog.service_update_failed");
    }
    revalidatePath("/catalog");
    return ok(active ? "catalog.service_active" : "catalog.service_inactive");
  } catch {
    return fail("catalog.service_update_failed");
  }
}

export async function deleteServiceAction(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireSessionContext();
    const supabase = await createClient();

    const { data: service } = await supabase
      .from("services")
      .select("id, name")
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId)
      .maybeSingle();
    if (!service) return fail("catalog.service_not_found");

    const { count, error: countError } = await supabase
      .from("quote_items")
      .select("id", { count: "exact", head: true })
      .eq("service_id", id);
    if (countError) return fail("error.generic");
    if (count && count > 0) {
      return fail("catalog.service_in_use", { name: service.name, count });
    }

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);
    if (error) {
      if (error.code === "23503") {
        return fail("catalog.service_referenced", { name: service.name });
      }
      return fail("error.generic");
    }

    revalidatePath("/catalog");
    return ok("catalog.service_deleted_named", { name: service.name });
  } catch {
    return fail("catalog.service_delete_failed");
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
    if (!name) return fail("catalog.name_required");

    const { data: dup } = await supabase
      .from("materials")
      .select("id")
      .eq("tenant_id", ctx.tenantId)
      .ilike("name", name)
      .maybeSingle();
    if (dup) return fail("catalog.name_taken");

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
    if (error) return fail("catalog.material_save_failed");

    const price = formData.get("unit_price");
    if (price !== null && price !== "" && Number(price) >= 0) {
      const { error: pErr } = await supabase.from("material_prices").insert({
        tenant_id: ctx.tenantId,
        material_id: material.id,
        unit_price: Number(price),
        currency: ctx.currency,
        valid_from: new Date().toISOString().slice(0, 10),
      });
      if (pErr) return fail("catalog.material_save_failed");
    }

    revalidatePath("/catalog");
    return ok("catalog.material_saved_named", { name });
  } catch {
    return fail("catalog.material_save_failed");
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
      return fail("catalog.price_invalid");
    }

    const { error } = await supabase.from("material_prices").insert({
      tenant_id: ctx.tenantId,
      material_id: materialId,
      unit_price: unitPrice,
      currency: ctx.currency,
      valid_from: validFrom,
    });
    if (error) return fail("catalog.price_update_failed");

    revalidatePath("/catalog");
    return ok("catalog.price_updated");
  } catch {
    return fail("catalog.price_update_failed");
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
    if (!name) return fail("catalog.name_required");

    const { data: dup } = await supabase
      .from("job_categories")
      .select("id")
      .eq("tenant_id", ctx.tenantId)
      .ilike("name", name)
      .maybeSingle();
    if (dup) return fail("catalog.name_taken");

    const { error } = await supabase
      .from("job_categories")
      .insert({ tenant_id: ctx.tenantId, name });
    if (error) return fail("catalog.category_save_failed");

    revalidatePath("/catalog");
    return ok("catalog.category_saved_named", { name });
  } catch {
    return fail("catalog.category_save_failed");
  }
}

export async function toggleJobCategoryAction(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    const ctx = await requireSessionContext();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("job_categories")
      .update({ active })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId)
      .select("id, active")
      .single();
    if (error) return fail("catalog.category_update_failed");
    if (!data || data.active !== active) {
      return fail("catalog.category_update_failed");
    }
    revalidatePath("/catalog");
    return ok(active ? "catalog.category_active" : "catalog.category_inactive");
  } catch {
    return fail("catalog.category_update_failed");
  }
}

export async function toggleMaterialAction(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    const ctx = await requireSessionContext();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("materials")
      .update({ active })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId)
      .select("id, active")
      .single();
    if (error) return fail("catalog.material_update_failed");
    if (!data || data.active !== active) {
      return fail("catalog.material_update_failed");
    }
    revalidatePath("/catalog");
    return ok(active ? "catalog.material_active" : "catalog.material_inactive");
  } catch {
    return fail("catalog.material_update_failed");
  }
}
