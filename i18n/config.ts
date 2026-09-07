export const locales = ["en", "pl"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeCookie = "locale";

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "pl";
}
