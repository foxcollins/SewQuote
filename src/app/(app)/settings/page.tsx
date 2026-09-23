import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { updateTenantSettingsAction } from "@/modules/tenant/actions";

const input =
  "mt-1 h-11 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm";

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
    <main className="mx-auto max-w-lg p-4 pb-24">
      <h1 className="mb-4 text-2xl font-semibold">Configuración</h1>

      <form
        action={updateTenantSettingsAction}
        className="space-y-4 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        <h2 className="text-sm font-semibold">Atelier</h2>
        <label className="block text-sm font-semibold">
          Nombre
          <input name="name" required defaultValue={tenant?.name ?? ""} className={input} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            País
            <input name="country" defaultValue={tenant?.country ?? ""} className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Moneda
            <input name="currency" defaultValue={tenant?.currency ?? "BRL"} className={input} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            Zona horaria
            <input name="timezone" defaultValue={tenant?.timezone ?? "UTC"} className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Idioma
            <select name="locale" defaultValue={tenant?.locale ?? "es"} className={input}>
              <option value="es">Español</option>
              <option value="pt-BR">Português (BR)</option>
            </select>
          </label>
        </div>

        <h2 className="pt-2 text-sm font-semibold">Precios base</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            Tarifa horaria
            <input
              name="hourly_rate"
              type="number"
              step="0.01"
              defaultValue={tenant?.hourly_rate ?? 0}
              className={input}
            />
          </label>
          <label className="block text-sm font-semibold">
            Margen %
            <input
              name="default_margin_percent"
              type="number"
              step="0.01"
              defaultValue={tenant?.default_margin_percent ?? 40}
              className={input}
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
              className={input}
            />
          </label>
          <label className="block text-sm font-semibold">
            Alerta medidas (días)
            <input
              name="measurement_stale_days"
              type="number"
              defaultValue={tenant?.measurement_stale_days ?? 30}
              className={input}
            />
          </label>
        </div>

        <h2 className="pt-2 text-sm font-semibold">Factores de complejidad</h2>
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

        <h2 className="pt-2 text-sm font-semibold">Factores de urgencia</h2>
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

        <button
          type="submit"
          className="h-12 w-full rounded-[6px] bg-[var(--primary)] text-sm font-semibold text-[var(--on-primary)]"
        >
          Guardar configuración
        </button>
      </form>

      <section className="mt-6 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
        <h2 className="mb-2 text-sm font-semibold">Cuenta</h2>
        <p className="text-[var(--ink-muted)]">{ctx.profileName}</p>
        <p className="text-xs text-[var(--ink-muted)]">
          {ctx.tenantName} · {ctx.currency} · {ctx.locale}
        </p>
      </section>
    </main>
  );
}
