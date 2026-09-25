import { cookies } from "next/headers";

import { LOCALE_COOKIE, localeFromValue, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export async function readLocaleCookie(): Promise<Locale | null> {
  const store = await cookies();
  return localeFromValue(store.get(LOCALE_COOKIE)?.value);
}

export async function syncTenantLocale(
  value: unknown,
): Promise<Locale | null> {
  const locale = localeFromValue(value);
  if (!locale) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  await supabase
    .from("tenants")
    .update({ locale })
    .eq("id", profile.tenant_id);
  return locale;
}
