import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readLocaleCookie, syncTenantLocale } from "@/lib/tenant-locale";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const redirect = new URL("/", origin);
    redirect.searchParams.set(
      "auth_error",
      errorDescription || error || "oauth_error",
    );
    return NextResponse.redirect(redirect);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code,
    );
    if (!exchangeError) {
      const locale = await readLocaleCookie();
      if (locale) await syncTenantLocale(locale);
      const safeNext = next.startsWith("/") ? next : "/dashboard";
      return NextResponse.redirect(new URL(safeNext, origin));
    }
  }

  return NextResponse.redirect(
    new URL("/?auth_error=callback_failed", origin),
  );
}
