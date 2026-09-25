"use server";

import { revalidatePath } from "next/cache";
import { normalizeLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/session";

export async function updateTenantSettingsAction(formData: FormData) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name required");
  const locale = normalizeLocale(formData.get("locale") ?? ctx.locale);

  const complexityFactors = {
    low: Number(formData.get("cx_low") ?? 0),
    medium: Number(formData.get("cx_medium") ?? 0.1),
    high: Number(formData.get("cx_high") ?? 0.2),
    very_high: Number(formData.get("cx_very_high") ?? 0.35),
  };
  const urgencyFactors = {
    normal: Number(formData.get("ur_normal") ?? 0),
    urgent: Number(formData.get("ur_urgent") ?? 0.2),
    very_urgent: Number(formData.get("ur_very_urgent") ?? 0.4),
  };

  const { error } = await supabase
    .from("tenants")
    .update({
      name,
      country: String(formData.get("country") ?? "").trim() || null,
      currency: String(formData.get("currency") ?? ctx.currency).trim() || ctx.currency,
      timezone: String(formData.get("timezone") ?? ctx.timezone).trim() || ctx.timezone,
      locale,
      hourly_rate: Number(formData.get("hourly_rate") ?? 0),
      default_margin_percent: Number(formData.get("default_margin_percent") ?? 40),
      default_waste_percent: Number(formData.get("default_waste_percent") ?? 0),
      measurement_stale_days: Number(formData.get("measurement_stale_days") ?? 30),
      complexity_factors: complexityFactors,
      urgency_factors: urgencyFactors,
    })
    .eq("id", ctx.tenantId);
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  return { locale };
}

export async function syncTenantLocaleAction(value: unknown) {
  const locale = normalizeLocale(value);
  const ctx = await requireSessionContext();
  if (ctx.locale === locale) return { locale };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({ locale })
    .eq("id", ctx.tenantId);
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  return { locale };
}
