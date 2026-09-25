import { normalizeLocale, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export type SessionContext = {
  userId: string;
  tenantId: string;
  profileName: string;
  tenantName: string;
  currency: string;
  locale: Locale;
  hourlyRate: number;
  defaultMarginPercent: number;
  defaultWastePercent: number;
  complexityFactors: Record<string, number>;
  urgencyFactors: Record<string, number>;
  measurementStaleDays: number;
  timezone: string;
};

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, tenant_id, name")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  const { data: tenant } = await supabase
    .from("tenants")
    .select(
      "id, name, currency, locale, hourly_rate, default_margin_percent, default_waste_percent, complexity_factors, urgency_factors, measurement_stale_days, timezone",
    )
    .eq("id", profile.tenant_id)
    .single();
  if (!tenant) return null;

  return {
    userId: user.id,
    tenantId: profile.tenant_id,
    profileName: profile.name,
    tenantName: tenant.name,
    currency: tenant.currency,
    locale: normalizeLocale(tenant.locale),
    hourlyRate: Number(tenant.hourly_rate),
    defaultMarginPercent: Number(tenant.default_margin_percent),
    defaultWastePercent: Number(tenant.default_waste_percent),
    complexityFactors:
      tenant.complexity_factors as SessionContext["complexityFactors"],
    urgencyFactors: tenant.urgency_factors as SessionContext["urgencyFactors"],
    measurementStaleDays: tenant.measurement_stale_days,
    timezone: tenant.timezone,
  };
}

export async function requireSessionContext(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) throw new Error("UNAUTHORIZED");
  return ctx;
}
