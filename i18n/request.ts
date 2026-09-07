import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, localeCookie, type Locale } from "@/i18n/config";
import en from "@/messages/en.json";
import pl from "@/messages/pl.json";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    if (isRecord(value) && isRecord(out[key])) {
      out[key] = deepMerge(out[key], value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

export default getRequestConfig(async () => {
  const cookie = (await cookies()).get(localeCookie)?.value;
  const locale: Locale = isLocale(cookie) ? cookie : defaultLocale;
  return {
    locale,
    messages:
      locale === "pl"
        ? (deepMerge(en as Record<string, unknown>, pl as Record<string, unknown>) as typeof en)
        : en,
  };
});
