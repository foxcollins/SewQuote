import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/modules/tenant/settings-form";
import {
  Card,
  PageHeader,
  SectionTitle,
  inputClass,
} from "@/components/ui/primitives";

export default async function SettingsPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", ctx.tenantId)
    .single();

  const cx = (tenant?.complexity_factors ?? {}) as Record<string, number>;
  const ur = (tenant?.urgency_factors ?? {}) as Record<string, number>;

  return (
    <main className="mx-auto max-w-lg p-4 pb-28">
      <PageHeader title="Configuración" subtitle="Atelier, precios y factores" />

      <SettingsForm>
        <SectionTitle>Atelier</SectionTitle>
        <label className="block text-sm font-semibold">
          Nombre
          <input name="name" required defaultValue={tenant?.name ?? ""} className={inputClass} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            País
            <input name="country" defaultValue={tenant?.country ?? ""} className={inputClass} />
          </label>
          <label className="block text-sm font-semibold">
            Moneda
            <input name="currency" defaultValue={tenant?.currency ?? "BRL"} className={inputClass} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            Zona horaria
            <input name="timezone" defaultValue={tenant?.timezone ?? "UTC"} className={inputClass} />
          </label>
          <label className="block text-sm font-semibold">
            Idioma
            <select name="locale" defaultValue={tenant?.locale ?? "es"} className={inputClass}>
              <option value="es">Español</option>
              <option value="pt-BR">Português (BR)</option>
            </select>
          </label>
        </div>

        <SectionTitle>Precios base</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            Tarifa horaria
            <input
              name="hourly_rate"
              type="number"
              step="0.01"
              defaultValue={tenant?.hourly_rate ?? 0}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            Margen %
            <input
              name="default_margin_percent"
              type="number"
              step="0.01"
              defaultValue={tenant?.default_margin_percent ?? 40}
              className={inputClass}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            Merma %
            <input
              name="default_waste_percent"
              type="number"
              step="0.01"
              defaultValue={tenant?.default_waste_percent ?? 0}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            Alerta medidas (días)
            <input
              name="measurement_stale_days"
              type="number"
              defaultValue={tenant?.measurement_stale_days ?? 30}
              className={inputClass}
            />
          </label>
        </div>

        <SectionTitle>Factores de complejidad</SectionTitle>
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              ["cx_low", "Baja", cx.low ?? 0],
              ["cx_medium", "Media", cx.medium ?? 0.1],
              ["cx_high", "Alta", cx.high ?? 0.2],
              ["cx_very_high", "Muy alta", cx.very_high ?? 0.35],
            ] as const
          ).map(([name, label, value]) => (
            <label key={name} className="block text-xs font-semibold">
              {label}
              <input
                name={name}
                type="number"
                step="0.01"
                defaultValue={value}
                className="mt-1 h-10 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
              />
            </label>
          ))}
        </div>

        <SectionTitle>Factores de urgencia</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["ur_normal", "Normal", ur.normal ?? 0],
              ["ur_urgent", "Urgente", ur.urgent ?? 0.2],
              ["ur_very_urgent", "Muy urgente", ur.very_urgent ?? 0.4],
            ] as const
          ).map(([name, label, value]) => (
            <label key={name} className="block text-xs font-semibold">
              {label}
              <input
                name={name}
                type="number"
                step="0.01"
                defaultValue={value}
                className="mt-1 h-10 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
              />
            </label>
          ))}
        </div>
      </SettingsForm>

      <Card className="mt-6 p-4 text-sm">
        <SectionTitle>Cuenta</SectionTitle>
        <p className="text-[var(--ink-muted)]">{ctx.profileName}</p>
        <p className="text-xs text-[var(--ink-muted)]">
          {ctx.tenantName} · {ctx.currency} · {ctx.locale}
        </p>
      </Card>
    </main>
  );
}
