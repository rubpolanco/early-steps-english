import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocale, type Locale } from "./types";
import { en as commonEn, es as commonEs } from "./common";
import { en as staffEn, es as staffEs } from "./staff";
import { en as parentEn, es as parentEs } from "./parent";

export type { Locale } from "./types";
export { LOCALE_COOKIE } from "./types";

const dictionaries = {
  en: { ...commonEn, staffApp: staffEn, parentApp: parentEn },
  es: { ...commonEs, staffApp: staffEs, parentApp: parentEs },
};

export type Dictionary = typeof dictionaries.en;

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : "en";
}

/** Convenience helper: returns both the current locale and its dictionary. */
export async function getDict(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}

/**
 * Classroom age groups are free-text data (e.g. "1–2 years"), not UI copy,
 * so they don't live in the dictionary — but they're shown right next to
 * translated labels, so a stray "years" reads oddly on the Spanish pages.
 * This is a light, display-only translation of the one word pattern the
 * seed data actually uses; it leaves anything else untouched.
 */
export function translateAgeGroup(ageGroup: string | null | undefined, locale: Locale): string {
  if (!ageGroup) return "";
  if (locale !== "es") return ageGroup;
  return ageGroup.replace(/\byears?\b/i, "años");
}
