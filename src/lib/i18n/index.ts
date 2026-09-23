export type Locale = "es" | "pt-BR";

export const locales: Locale[] = ["es", "pt-BR"];
export const defaultLocale: Locale = "es";

import es from "./es.json";
import ptBR from "./pt-BR.json";

const dictionaries = { es, "pt-BR": ptBR } as const;

export function getDict(locale: Locale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export function t(
  locale: Locale,
  key: keyof typeof es,
  vars?: Record<string, string | number>,
): string {
  const dict = getDict(locale) as Record<string, string>;
  let value = dict[key] ?? (es as Record<string, string>)[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replaceAll(`{${k}}`, String(v));
    }
  }
  return value;
}

export function formatMoney(
  amount: number,
  currency: string,
  locale: Locale,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(
  date: Date | string,
  locale: Locale,
  timeZone?: string,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone,
  }).format(d);
}
