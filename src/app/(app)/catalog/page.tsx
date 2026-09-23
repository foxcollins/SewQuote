import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, type Locale } from "@/lib/i18n";
import { CatalogClient } from "@/modules/catalog/catalog-client";

export default async function CatalogPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");
  const locale = (ctx.locale as Locale) || "es";
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [servicesRes, materialsRes, catsRes, pricesRes] = await Promise.all([
    supabase.from("services").select("*").order("name"),
    supabase.from("materials").select("*").order("name"),
    supabase.from("job_categories").select("*").order("name"),
    supabase
      .from("material_prices")
      .select("material_id, unit_price, valid_from")
      .order("valid_from", { ascending: false }),
  ]);

  const currentPrice = new Map<string, number>();
  const priceCount = new Map<string, number>();
  for (const p of pricesRes.data ?? []) {
    priceCount.set(
      p.material_id,
      (priceCount.get(p.material_id) ?? 0) + 1,
    );
    if (p.valid_from <= today && !currentPrice.has(p.material_id)) {
      currentPrice.set(p.material_id, Number(p.unit_price));
    }
  }

  const money = (n: number) => formatMoney(n, ctx.currency, locale);

  return (
    <CatalogClient
      services={(servicesRes.data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        base_price: s.base_price,
        estimated_minutes: s.estimated_minutes,
        active: s.active,
      }))}
      materials={(materialsRes.data ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        unit: m.unit,
        category: m.category,
        active: m.active,
        current_price: currentPrice.get(m.id) ?? null,
        price_count: priceCount.get(m.id) ?? 0,
      }))}
      categories={(catsRes.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        active: c.active,
      }))}
      currency={ctx.currency}
      money={money}
      today={today}
    />
  );
}
