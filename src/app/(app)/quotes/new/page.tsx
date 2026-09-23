import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { QuoteBuilder } from "@/modules/quotes/quote-builder";
import type { TenantPricingConfig } from "@/modules/pricing/engine";
import type { Locale } from "@/lib/i18n";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");
  const { client_id } = await searchParams;
  const supabase = await createClient();

  const [clientsRes, personsRes, servicesRes, materialsRes, catsRes] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, name")
        .is("archived_at", null)
        .order("name"),
      supabase.from("persons").select("id, name, client_id").order("name"),
      supabase
        .from("services")
        .select("id, name, base_price, estimated_minutes")
        .eq("active", true)
        .order("name"),
      supabase.from("materials").select("id, name, unit, active").eq("active", true).order("name"),
      supabase
        .from("job_categories")
        .select("id, name")
        .eq("active", true)
        .order("name"),
    ]);

  type MatRow = { id: string; name: string; unit: string };
  const mats = (materialsRes.data ?? []) as MatRow[];
  let materials: {
    id: string;
    name: string;
    unit: string;
    unit_price: number;
  }[] = mats.map((m) => ({ ...m, unit_price: 0 }));

  if (mats.length) {
    const { data: prices } = await supabase
      .from("material_prices")
      .select("material_id, unit_price, valid_from")
      .in("material_id", mats.map((m) => m.id))
      .order("valid_from", { ascending: false });
    const today = new Date().toISOString().slice(0, 10);
    const priceMap = new Map<string, number>();
    for (const p of prices ?? []) {
      if (p.valid_from <= today && !priceMap.has(p.material_id)) {
        priceMap.set(p.material_id, Number(p.unit_price));
      }
    }
    materials = mats.map((m) => ({
      ...m,
      unit_price: priceMap.get(m.id) ?? 0,
    }));
  }

  const config: TenantPricingConfig = {
    hourlyRate: ctx.hourlyRate,
    defaultMarginPercent: ctx.defaultMarginPercent,
    defaultWastePercent: ctx.defaultWastePercent,
    complexityFactors: ctx.complexityFactors as TenantPricingConfig["complexityFactors"],
    urgencyFactors: ctx.urgencyFactors as TenantPricingConfig["urgencyFactors"],
  };

  return (
    <main className="mx-auto max-w-lg p-4 pb-24">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Nuevo presupuesto</h1>
        <p className="text-xs text-[var(--ink-muted)]">
          Cliente → trabajos (N) → servicios/materiales → cálculo → borrador
        </p>
      </header>
      <QuoteBuilder
        clients={clientsRes.data ?? []}
        persons={personsRes.data ?? []}
        services={servicesRes.data ?? []}
        materials={materials}
        categories={catsRes.data ?? []}
        config={config}
        currency={ctx.currency}
        locale={(ctx.locale as Locale) || "es"}
        presetClientId={client_id}
      />
    </main>
  );
}
