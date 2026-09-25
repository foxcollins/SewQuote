import es from "./es.json";
import ptBR from "./pt-BR.json";

export const locales = ["es", "pt-BR"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

export const LOCALE_COOKIE = "sewquote_locale";

type Dictionary = Record<string, string>;

const dictionaries: Record<Locale, Dictionary> = {
  es,
  "pt-BR": ptBR,
};

export type TranslationKey = keyof typeof es;
export type TranslationVars = Record<string, string | number>;

export function localeFromValue(value: unknown): Locale | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/_/g, "-");
  if (normalized === "pt-br" || normalized === "pt") return "pt-BR";
  if (normalized === "es" || normalized.startsWith("es-")) return "es";
  return null;
}

export function normalizeLocale(value: unknown): Locale {
  return localeFromValue(value) ?? defaultLocale;
}

export function isLocale(value: unknown): value is Locale {
  return localeFromValue(value) !== null;
}

export function getDict(locale: Locale | string | null | undefined): Dictionary {
  return dictionaries[normalizeLocale(locale)];
}

export function t(
  locale: Locale | string | null | undefined,
  key: TranslationKey | string,
  vars?: TranslationVars,
): string {
  const normalized = normalizeLocale(locale);
  const dict = dictionaries[normalized];
  const fallback = dictionaries[defaultLocale];
  let value = dict[key] ?? fallback[key] ?? key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, String(replacement));
    }
  }
  return value;
}

export function createTranslator(locale: Locale | string | null | undefined) {
  return (key: TranslationKey | string, vars?: TranslationVars) =>
    t(locale, key, vars);
}

export function pluralSuffix(count: number): "_one" | "_many" {
  return Math.abs(count) === 1 ? "_one" : "_many";
}

export function tp(
  locale: Locale | string | null | undefined,
  key: TranslationKey | string,
  count: number,
  vars?: TranslationVars,
): string {
  return t(locale, `${key}${pluralSuffix(count)}`, { count, ...vars });
}

export function formatNumber(
  value: number,
  locale: Locale | string | null | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(normalizeLocale(locale), options).format(value);
  } catch {
    return String(value);
  }
}

export function formatMoney(
  amount: number,
  currency: string | null | undefined,
  locale: Locale | string | null | undefined,
): string {
  const normalized = normalizeLocale(locale);
  if (!currency?.trim()) return formatNumber(amount, normalized);
  try {
    return new Intl.NumberFormat(normalized, {
      style: "currency",
      currency: currency.trim(),
    }).format(amount);
  } catch {
    return formatNumber(amount, normalized);
  }
}

export function formatMeasurement(
  value: number,
  unit: string,
  locale: Locale | string | null | undefined,
): string {
  return `${formatNumber(value, locale, { maximumFractionDigits: 2 })} ${unit}`;
}

export function formatDate(
  date: Date | string | null | undefined,
  locale: Locale | string | null | undefined,
  timeZone?: string | null,
): string {
  if (!date) return "—";
  const parsed =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(`${date}T12:00:00`)
      : date instanceof Date
        ? date
        : new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  const normalized = normalizeLocale(locale);
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    ...(timeZone ? { timeZone } : {}),
  };
  try {
    return new Intl.DateTimeFormat(normalized, options).format(parsed);
  } catch {
    try {
      return new Intl.DateTimeFormat(normalized, {
        dateStyle: "medium",
      }).format(parsed);
    } catch {
      return parsed.toISOString().slice(0, 10);
    }
  }
}

export function localeFromAcceptLanguage(
  value: string | null | undefined,
  fallback: Locale = defaultLocale,
): Locale {
  if (!value) return fallback;
  const candidates = value
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const quality = params
        .map((param) => Number(param.trim().split("=")[1]))
        .find((param) => Number.isFinite(param));
      return { tag: tag.trim(), quality: Number.isFinite(quality) ? quality! : 0 };
    })
    .sort((a, b) => b.quality - a.quality);
  for (const candidate of candidates) {
    const locale = localeFromValue(candidate.tag);
    if (locale) return locale;
  }
  return normalizeLocale(fallback);
}

export function statusLabel(
  locale: Locale | string | null | undefined,
  domain: "quote" | "work",
  status: string,
): string {
  return t(locale, `${domain}.status.${status}`);
}

export function complexityLabel(
  locale: Locale | string | null | undefined,
  complexity: string,
): string {
  return t(locale, `complexity.${complexity}`);
}

export function urgencyLabel(
  locale: Locale | string | null | undefined,
  urgency: string,
): string {
  return t(locale, `urgency.${urgency}`);
}

export function versionReasonLabel(
  locale: Locale | string | null | undefined,
  reason: string,
): string {
  return t(locale, `version.reason.${reason}`);
}

const measurementKeys: Record<string, string> = {
  busto: "measurement.bust",
  bust: "measurement.bust",
  peitoral: "measurement.bust",
  cintura: "measurement.waist",
  waist: "measurement.waist",
  cadera: "measurement.hip",
  quadril: "measurement.hip",
  hip: "measurement.hip",
  largo: "measurement.length",
  comprimento: "measurement.length",
  length: "measurement.length",
  manga: "measurement.sleeve",
  sleeve: "measurement.sleeve",
  hombro: "measurement.shoulder",
  ombro: "measurement.shoulder",
  shoulder: "measurement.shoulder",
  cuello: "measurement.neck",
  pescoco: "measurement.neck",
  neck: "measurement.neck",
};

function foldMeasurementName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function measurementFieldLabel(
  locale: Locale | string | null | undefined,
  name: string,
): string {
  const key = measurementKeys[foldMeasurementName(name)];
  return key ? t(locale, key) : name;
}

const defaultMeasurementKeys = [
  "measurement.bust",
  "measurement.waist",
  "measurement.hip",
  "measurement.length",
  "measurement.sleeve",
  "measurement.shoulder",
  "measurement.neck",
] as const;

export function defaultMeasurementFieldNames(
  locale: Locale | string | null | undefined,
): string[] {
  return defaultMeasurementKeys.map((key) => t(locale, key));
}

function messageText(message: unknown): string {
  if (typeof message === "string") return message;
  if (message && typeof message === "object" && "message" in message) {
    return String(message.message);
  }
  return "";
}

export function translateServerMessage(
  message: unknown,
  locale: Locale | string | null | undefined,
): string {
  const raw = messageText(message).trim();
  const lower = raw.toLowerCase();
  if (lower === "expired") return t(locale, "public.expired");
  if (lower === "unauthorized") return t(locale, "auth.unauthorized");
  if (lower === "not_found" || lower.includes("not found")) {
    return t(locale, "error.not_found");
  }
  if (lower.includes("invalid transition")) {
    return t(locale, "error.invalid_transition");
  }
  if (lower.includes("invalid credentials") || lower.includes("invalid login")) {
    return t(locale, "auth.invalid_credentials");
  }
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return t(locale, "error.duplicate");
  }
  if (lower.includes("password")) return t(locale, "auth.weak_password");
  if (
    lower.includes("name required") ||
    lower.includes("client required") ||
    lower.includes("person required")
  ) {
    return t(locale, "error.required");
  }
  if (lower.includes("jobs required")) return t(locale, "error.required");
  if (lower.includes("only draft") || lower.includes("borradores")) {
    return t(locale, "error.invalid_state");
  }
  if (lower.includes("only sent") || lower.includes("only accepted") || lower.includes("only expired")) {
    return t(locale, "error.invalid_state");
  }
  if (lower.includes("invalid price") || lower.includes("precio inválido")) {
    return t(locale, "error.invalid_price");
  }
  if (
    lower.includes("ya tiene una orden de trabajo") ||
    lower.includes("already tiene una orden") ||
    lower.includes("work order")
  ) {
    return t(locale, "error.work_order_exists");
  }
  if (lower.includes("configuración guardada")) return t(locale, "settings.saved");
  if (lower.includes("servicio") && lower.includes("guardad")) {
    return t(locale, "catalog.service_saved");
  }
  if (lower.includes("servicio") && lower.includes("eliminad")) {
    return t(locale, "catalog.service_deleted");
  }
  if (lower.includes("servicio") && lower.includes("activad")) {
    return t(locale, "catalog.service_active");
  }
  if (lower.includes("servicio") && lower.includes("desactivad")) {
    return t(locale, "catalog.service_inactive");
  }
  if (lower.includes("material") && lower.includes("guardad")) {
    return t(locale, "catalog.material_saved");
  }
  if (lower.includes("material") && lower.includes("activad")) {
    return t(locale, "catalog.material_active");
  }
  if (lower.includes("material") && lower.includes("desactivad")) {
    return t(locale, "catalog.material_inactive");
  }
  if (lower.includes("precio") && lower.includes("actualiz")) {
    return t(locale, "catalog.price_updated");
  }
  if (lower.includes("categor") && lower.includes("guardad")) {
    return t(locale, "catalog.category_saved");
  }
  if (lower.includes("categor") && lower.includes("activad")) {
    return t(locale, "catalog.category_active");
  }
  if (lower.includes("categor") && lower.includes("desactivad")) {
    return t(locale, "catalog.category_inactive");
  }
  if (raw) return t(locale, "error.generic");
  return t(locale, "error.generic");
}

export function translateError(
  error: unknown,
  locale: Locale | string | null | undefined,
): string {
  return translateServerMessage(error, locale);
}
