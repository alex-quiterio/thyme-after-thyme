/** Pure locale definitions: safe to import from any layer (no React, no browser APIs). */
export const locales = ["en", "pt", "it"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  it: "Italiano",
};

/** One value per language. Using this type makes a missing translation a compile error. */
export type Localized<T> = Record<Locale, T>;

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (locales as readonly string[]).includes(value);

/** 1.5 -> "1,5" for languages that use a decimal comma. */
export function localizeDecimal(text: string, locale: Locale): string {
  return locale === "en" ? text : text.replace(".", ",");
}
