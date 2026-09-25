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
import { t } from "@/lib/i18n";

export default async function SettingsPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");
  const locale = ctx.locale;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", ctx.tenantId)
    .single();

  const cx = (tenant?.complexity_factors ?? {}) as Record<string, number>;
  const ur = (tenant?.urgency_factors ?? {}) as Record<string, number>;

  return (
    <main className="mx-auto max-w-2xl pb-8">
      <PageHeader
        title={t(locale, "settings.title")}
        subtitle={t(locale, "settings.subtitle")}
      />

      <SettingsForm>
        <SectionTitle>{t(locale, "settings.section_atelier")}</SectionTitle>
        <p className="-mt-2 mb-1 text-xs text-[var(--ink-muted)]">
          {t(locale, "settings.atelier_section_hint")}
        </p>
        <label className="block text-sm font-semibold">
          {t(locale, "settings.name")}
          <input name="name" required defaultValue={tenant?.name ?? ""} className={inputClass} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            {t(locale, "settings.country")}
            <input name="country" defaultValue={tenant?.country ?? ""} className={inputClass} />
          </label>
          <label className="block text-sm font-semibold">
            {t(locale, "common.currency")}
            <input
              name="currency"
              defaultValue={tenant?.currency ?? ctx.currency}
              className={inputClass}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            {t(locale, "common.timezone")}
            <input
              name="timezone"
              defaultValue={tenant?.timezone ?? ctx.timezone}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            {t(locale, "common.language")}
            <select
              name="locale"
              defaultValue={tenant?.locale ?? ctx.locale}
              className={inputClass}
            >
              <option value="es">{t(locale, "settings.locale_es")}</option>
              <option value="pt-BR">{t(locale, "settings.locale_pt")}</option>
            </select>
          </label>
        </div>
        <p className="text-xs text-[var(--ink-muted)]">
          {t(locale, "settings.locale_hint")}
        </p>

        <SectionTitle>{t(locale, "settings.base_prices")}</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            {t(locale, "settings.hourly_rate")}
            <input
              name="hourly_rate"
              type="number"
              step="0.01"
              defaultValue={tenant?.hourly_rate ?? 0}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            {t(locale, "settings.margin")}
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
            {t(locale, "settings.waste")}
            <input
              name="default_waste_percent"
              type="number"
              step="0.01"
              defaultValue={tenant?.default_waste_percent ?? 0}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            {t(locale, "settings.stale_days")}
            <input
              name="measurement_stale_days"
              type="number"
              defaultValue={tenant?.measurement_stale_days ?? 30}
              className={inputClass}
            />
          </label>
        </div>

        <SectionTitle>{t(locale, "settings.complexity_factors")}</SectionTitle>
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              ["cx_low", t(locale, "settings.cx_low"), cx.low ?? 0],
              ["cx_medium", t(locale, "settings.cx_medium"), cx.medium ?? 0.1],
              ["cx_high", t(locale, "settings.cx_high"), cx.high ?? 0.2],
              ["cx_very_high", t(locale, "settings.cx_very_high"), cx.very_high ?? 0.35],
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

        <SectionTitle>{t(locale, "settings.urgency_factors")}</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["ur_normal", t(locale, "settings.ur_normal"), ur.normal ?? 0],
              ["ur_urgent", t(locale, "settings.ur_urgent"), ur.urgent ?? 0.2],
              ["ur_very_urgent", t(locale, "settings.ur_very_urgent"), ur.very_urgent ?? 0.4],
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
        <SectionTitle>{t(locale, "settings.account")}</SectionTitle>
        <p className="text-[var(--ink-muted)]">{ctx.profileName}</p>
        <p className="text-xs text-[var(--ink-muted)]">
          {ctx.tenantName} · {ctx.currency} · {ctx.locale}
        </p>
      </Card>
    </main>
  );
}
