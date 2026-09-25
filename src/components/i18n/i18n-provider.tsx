"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  createTranslator,
  formatDate as formatDateValue,
  formatMeasurement as formatMeasurementValue,
  formatMoney as formatMoneyValue,
  formatNumber as formatNumberValue,
  LOCALE_COOKIE,
  normalizeLocale,
  tp as translatePlural,
  type Locale,
  type TranslationKey,
  type TranslationVars,
} from "@/lib/i18n";

export { LOCALE_COOKIE };

type I18nContextValue = {
  locale: Locale;
  setLocale: (value: string | Locale) => void;
  t: (key: TranslationKey | string, vars?: TranslationVars) => string;
  tp: (key: TranslationKey | string, count: number, vars?: TranslationVars) => string;
  formatMoney: (amount: number, currency?: string | null) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date | string | null | undefined, timeZone?: string | null) => string;
  formatMeasurement: (value: number, unit: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function persistLocaleCookie(locale: Locale) {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; path=/; max-age=${oneYear}; samesite=lax`;
}

export function I18nProvider({
  initialLocale,
  syncDocumentLang = true,
  children,
}: {
  initialLocale?: string | null;
  syncDocumentLang?: boolean;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    normalizeLocale(initialLocale),
  );

  useEffect(() => {
    const normalized = normalizeLocale(initialLocale);
    setLocaleState(normalized);
    if (syncDocumentLang) document.documentElement.lang = normalized;
  }, [initialLocale, syncDocumentLang]);

  const setLocale = useCallback((value: string | Locale) => {
    const normalized = normalizeLocale(value);
    setLocaleState(normalized);
    document.documentElement.lang = normalized;
    persistLocaleCookie(normalized);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: createTranslator(locale),
      tp: (key, count, vars) => translatePlural(locale, key, count, vars),
      formatMoney: (amount, currency) => formatMoneyValue(amount, currency, locale),
      formatNumber: (amount, options) => formatNumberValue(amount, locale, options),
      formatDate: (date, timeZone) => formatDateValue(date, locale, timeZone),
      formatMeasurement: (value, unit) => formatMeasurementValue(value, unit, locale),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}
