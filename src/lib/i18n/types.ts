export type Locale = "en" | "es";

export const LOCALES: Locale[] = ["en", "es"];

export const LOCALE_COOKIE = "es_locale";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "es";
}
