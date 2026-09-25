import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import es from "./es.json";
import ptBR from "./pt-BR.json";
import {
  defaultMeasurementFieldNames,
  formatDate,
  formatMeasurement,
  formatMoney,
  formatNumber,
  getDict,
  isLocale,
  localeFromAcceptLanguage,
  localeFromValue,
  measurementFieldLabel,
  normalizeLocale,
  statusLabel,
  t,
  tp,
  translateError,
  translateServerMessage,
  type Locale,
} from "./index";

const esDict = es as Record<string, string>;
const ptDict = ptBR as Record<string, string>;

const esPath = join(__dirname, "es.json");
const ptPath = join(__dirname, "pt-BR.json");

function rawKeys(file: string): string[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .map((line) => /^ {2}"([^"]+)":/.exec(line)?.[1])
    .filter((key): key is string => Boolean(key));
}

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1]);
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry) && !entry.endsWith(".test.ts")) out.push(full);
  }
  return out;
}

function referencedTranslationKeys(): { key: string; where: string }[] {
  const srcDir = join(__dirname, "..", "..");
  const known = new Set(Object.keys(esDict).map((k) => k.split(".")[0]));
  const pattern = /["'`]([a-z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+)(?![.\w])/g;
  const found: { key: string; where: string }[] = [];
  for (const file of sourceFiles(srcDir)) {
    const text = readFileSync(file, "utf8");
    text.split(/\r?\n/).forEach((line, i) => {
      if (/^\s*\/\//.test(line)) return;
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(line))) {
        const key = match[1];
        if (!known.has(key.split(".")[0])) continue;
        found.push({ key, where: `${file}:${i + 1}` });
      }
    });
  }
  return found;
}

describe("AC-002: paridad de catálogos", () => {
  it("es y pt-BR tienen exactamente las mismas claves", () => {
    const esKeys = Object.keys(esDict).sort();
    const ptKeys = Object.keys(ptDict).sort();
    expect(esKeys).toEqual(ptKeys);
  });

  it("ningún valor está vacío", () => {
    for (const [locale, dict] of [
      ["es", esDict],
      ["pt-BR", ptDict],
    ] as const) {
      const empty = Object.entries(dict)
        .filter(([, value]) => !value.trim())
        .map(([key]) => `${locale}:${key}`);
      expect(empty).toEqual([]);
    }
  });

  it("los placeholders coinciden entre idiomas", () => {
    const mismatched: string[] = [];
    for (const key of Object.keys(esDict)) {
      const esPlaceholders = placeholders(esDict[key]).sort();
      const ptPlaceholders = placeholders(ptDict[key]).sort();
      if (esPlaceholders.join(",") !== ptPlaceholders.join(",")) {
        mismatched.push(key);
      }
    }
    expect(mismatched).toEqual([]);
  });

  it("AC-005: ninguna clave está duplicada en el archivo", () => {
    for (const file of [esPath, ptPath]) {
      const keys = rawKeys(file);
      const duplicates = keys.filter((key, i) => keys.indexOf(key) !== i);
      expect({ file, duplicates }).toEqual({ file, duplicates: [] });
    }
  });

  it("AC-005: toda clave referenciada en el código existe en ambos idiomas", () => {
    const missing: string[] = [];
    for (const { key, where } of referencedTranslationKeys()) {
      const resolvable =
        key in esDict ||
        `${key}_one` in esDict ||
        `${key}_many` in esDict ||
        Object.keys(esDict).some((k) => k.startsWith(`${key}.`));
      if (!resolvable) missing.push(`${key} (${where})`);
      if (!(key in ptDict)) missing.push(`pt-BR:${key} (${where})`);
    }
    expect(missing).toEqual([]);
  });
});

describe("AC-001/AC-002:lookup de traducciones", () => {
  it("t() devuelve el valor del idioma solicitado", () => {
    expect(t("es", "common.save")).toBe(esDict["common.save"]);
    expect(t("pt-BR", "common.save")).toBe(ptDict["common.save"]);
  });

  it("t() interpola variables", () => {
    const rendered = t("es", "clients.person.subtitle_of", { name: "Ana" });
    expect(rendered).toContain("Ana");
    expect(rendered).not.toContain("{name}");
  });

  it("AC-005: clave inexistente cae a la clave y no rompe", () => {
    expect(t("es", "clave.que.no.existe")).toBe("clave.que.no.existe");
    expect(getDict("en-US")).toBe(getDict("es"));
  });
});

describe("normalización de locale", () => {
  it("acepta variantes de español y portugués", () => {
    expect(localeFromValue("es")).toBe("es");
    expect(localeFromValue("es-MX")).toBe("es");
    expect(localeFromValue("pt")).toBe("pt-BR");
    expect(localeFromValue("pt-br")).toBe("pt-BR");
    expect(localeFromValue("pt_BR")).toBe("pt-BR");
  });

  it("rechaza valores no soportados", () => {
    expect(localeFromValue("fr")).toBeNull();
    expect(localeFromValue(42)).toBeNull();
    expect(isLocale("fr")).toBe(false);
    expect(normalizeLocale("fr")).toBe("es");
  });

  it("AC-004b: Accept-Language ordena por calidad y cae al default", () => {
    expect(localeFromAcceptLanguage("fr-FR,pt;q=0.9,es;q=0.8")).toBe("pt-BR");
    expect(localeFromAcceptLanguage("es-ES,es;q=0.9")).toBe("es");
    expect(localeFromAcceptLanguage("fr-FR")).toBe("es");
    expect(localeFromAcceptLanguage(null, "pt-BR")).toBe("pt-BR");
  });
});

describe("AC-003: formato monetario sin hardcodear moneda", () => {
  it("usa la moneda del tenant y el locale activo", () => {
    const brlEnPortugues = formatMoney(1234.56, "BRL", "pt-BR");
    const brlEnEspanol = formatMoney(1234.56, "BRL", "es");
    expect(brlEnPortugues).toMatch(/^R\$\s1\.234,56$/);
    expect(brlEnEspanol).not.toContain("R$");
    expect(brlEnEspanol).toContain("BRL");
    expect(formatMoney(1234.56, "USD", "es")).not.toBe(
      formatMoney(1234.56, "USD", "pt-BR"),
    );
  });

  it("sin moneda cae a número plano", () => {
    expect(formatMoney(10, null, "es")).toBe(formatNumber(10, "es"));
    expect(formatMoney(10, "", "es")).toBe(formatNumber(10, "es"));
  });

  it("moneda inválida no lanza", () => {
    expect(() => formatMoney(10, "no-es-moneda", "es")).not.toThrow();
  });
});

describe("AC-004: fechas con timezone del tenant", () => {
  const iso = "2026-03-10T23:30:00.000Z";

  it("el timezone cambia el día renderizado", () => {
    const saoPaulo = formatDate(iso, "pt-BR", "America/Sao_Paulo");
    const tokyo = formatDate(iso, "es", "Asia/Tokyo");
    expect(saoPaulo).not.toBe(tokyo);
  });

  it("un timezone inválido degrada a la fecha local", () => {
    expect(() => formatDate(iso, "es", "No/Zone")).not.toThrow();
  });

  it("valores vacíos o inválidos devuelven guion largo", () => {
    expect(formatDate(null, "es")).toBe("—");
    expect(formatDate("no-es-fecha", "es")).toBe("—");
  });
});

describe("AC-006: datos libres no se traducen", () => {
  it("formatMeasurement conserva la unidad del tenant", () => {
    expect(formatMeasurement(101.5, "cm", "es")).toBe(formatNumber(101.5, "es") + " cm");
    expect(formatMeasurement(101.5, "polegadas", "pt-BR")).toContain("polegadas");
  });

  it("measurementFieldLabel traduce campos conocidos y conserva los demás", () => {
    expect(measurementFieldLabel("es", "Busto")).toBe(t("es", "measurement.bust"));
    expect(measurementFieldLabel("pt-BR", "bust")).toBe(t("pt-BR", "measurement.bust"));
    expect(measurementFieldLabel("es", "Medida rara")).toBe("Medida rara");
  });

  it("reconoce los nombres de medida guardados en cualquiera de los dos idiomas", () => {
    expect(measurementFieldLabel("es", "Quadril")).toBe(t("es", "measurement.hip"));
    expect(measurementFieldLabel("pt-BR", "Cadera")).toBe(t("pt-BR", "measurement.hip"));
    expect(measurementFieldLabel("es", "Pescoço")).toBe(t("es", "measurement.neck"));
    expect(measurementFieldLabel("pt-BR", "Hombro")).toBe(t("pt-BR", "measurement.shoulder"));
  });

  it("defaultMeasurementFieldNames devuelve las 7 medidas sugeridas en el idioma activo", () => {
    const esNames = defaultMeasurementFieldNames("es");
    const ptNames = defaultMeasurementFieldNames("pt-BR");
    expect(esNames).toHaveLength(7);
    expect(ptNames).toHaveLength(7);
    expect(esNames).not.toEqual(ptNames);
    expect(esNames[0]).toBe(esDict["measurement.bust"]);
    expect(ptNames[2]).toBe(ptDict["measurement.hip"]);
    expect(defaultMeasurementFieldNames("en-US")).toEqual(esNames);
  });
});

describe("vocabularios de estado", () => {
  it("traduce estados de presupuesto y trabajo", () => {
    expect(statusLabel("es", "quote", "draft")).toBe(t("es", "quote.status.draft"));
    expect(statusLabel("pt-BR", "work", "in_production")).toBe(
      t("pt-BR", "work.status.in_production"),
    );
  });

  it("un estado desconocido devuelve la clave sin romper", () => {
    expect(statusLabel("es", "quote", "inventado")).toBe("quote.status.inventado");
  });
});

describe("traducción de errores del servidor", () => {
  it("traduce los mensajes conocidos de actions", () => {
    expect(translateError(new Error("Quote not found"), "es")).toBe(
      t("es", "error.not_found"),
    );
    expect(translateError("Solo los borradores pueden editarse", "pt-BR")).toBe(
      t("pt-BR", "error.invalid_state"),
    );
    expect(
      translateServerMessage(
        "Este presupuesto ya tiene una orden de trabajo",
        "pt-BR",
      ),
    ).toBe(t("pt-BR", "error.work_order_exists"));
    expect(translateError(new Error("Invalid transition draft"), "es")).toBe(
      t("es", "error.invalid_transition"),
    );
  });

  it("cualquier otro mensaje cae en genérico", () => {
    expect(translateError(new Error("boom"), "es")).toBe(t("es", "error.generic"));
    expect(translateError(undefined, "es")).toBe(t("es", "error.generic"));
  });
});

describe("pluralización", () => {
  it("elige la variante singular con count 1 y la plural con >1", () => {
    const rendered = (key: string, count: number) =>
      t("es", key, { count });

    expect(tp("es", "clients.detail.sets_count", 1)).toBe(
      rendered("clients.detail.sets_count_one", 1),
    );
    expect(tp("es", "clients.detail.sets_count", 3)).toBe(
      rendered("clients.detail.sets_count_many", 3),
    );
    expect(tp("es", "clients.detail.sets_count", 0)).toBe(
      rendered("clients.detail.sets_count_many", 0),
    );
  });
});

describe("tipos de locale", () => {
  it("Locale solo admite los idiomas soportados", () => {
    const supported: Locale[] = ["es", "pt-BR"];
    expect(supported.map(normalizeLocale)).toEqual(["es", "pt-BR"]);
  });
});
