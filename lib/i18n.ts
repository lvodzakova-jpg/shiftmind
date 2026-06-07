import { mergeTranslations } from "./translations-enterprise";
import {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  LOCALES,
  type Locale,
  translations,
} from "./translations";

const mergedTranslations = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    mergeTranslations(translations[locale], locale),
  ])
) as typeof translations;

export {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  LOCALES,
  translations,
  type Locale,
} from "./translations";

export const STORAGE_KEY = "shiftmind-locale";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && isLocale(stored) ? stored : DEFAULT_LOCALE;
}

type Params = Record<string, string | number>;

function getByPath(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}

export function translate(
  locale: Locale,
  key: string,
  params?: Params
): string {
  let text = getByPath(
    mergedTranslations[locale] as unknown as Record<string, unknown>,
    key
  );
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

export const LOCALE_DATE_FORMAT: Record<Locale, string> = {
  sk: "sk-SK",
  en: "en-US",
  es: "es-ES",
};

export const DAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export const DAY_SHORT_KEYS = [
  "monShort",
  "tueShort",
  "wedShort",
  "thuShort",
  "friShort",
  "satShort",
  "sunShort",
] as const;

export function getDayNames(locale: Locale): string[] {
  return DAY_KEYS.map((k) => translate(locale, `days.${k}`));
}

export function getDayNamesShort(locale: Locale): string[] {
  return DAY_SHORT_KEYS.map((k) => translate(locale, `days.${k}`));
}

export function getShiftLabel(locale: Locale, type: string): string {
  return translate(locale, `shifts.${type}`);
}

export function getAvailabilityLabel(locale: Locale, type: string): string {
  return translate(locale, `availability.${type}`);
}

export function roleToKey(role: string): string {
  const normalized = role.toLowerCase().replace(/\s+/g, "_");
  const map: Record<string, string> = {
    barista: "barista",
    senior_barista: "senior_barista",
    "senior barista": "senior_barista",
    manager: "manager",
    waiter: "waiter",
    manažérka: "manager",
    manažér: "manager",
    pomocník: "waiter",
    pečiar: "barista",
    assistant: "waiter",
    baker: "barista",
  };
  return map[role] ?? map[normalized] ?? normalized;
}

export function getRoleLabel(locale: Locale, role: string): string {
  const key = roleToKey(role);
  const translated = translate(locale, `roles.${key}`);
  return translated.startsWith("roles.") ? role : translated;
}

export const ROLE_OPTIONS = [
  { value: "barista", key: "barista" },
  { value: "senior_barista", key: "senior_barista" },
  { value: "manager", key: "manager" },
  { value: "waiter", key: "waiter" },
] as const;
