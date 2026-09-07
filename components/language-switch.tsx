"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { setLocale } from "@/actions/locale";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitch() {
  const locale = useLocale();
  const t = useTranslations("language");
  const [pending, start] = useTransition();

  return (
    <nav
      aria-label={t("switch")}
      className="flex items-center gap-1.5 font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.2em] uppercase"
    >
      {locales.map((value, index) => (
        <span key={value} className="flex items-center gap-1.5">
          {index > 0 ? <span className="text-[#d7d3c8]/35">·</span> : null}
          <button
            type="button"
            disabled={pending || locale === value}
            onClick={() => start(() => setLocale(value))}
            className={cn(
              "uppercase",
              locale === value
                ? "text-[#d4b36a]"
                : "text-[#d7d3c8] hover:text-[#d4b36a]",
            )}
          >
            {t(value as Locale)}
          </button>
        </span>
      ))}
    </nav>
  );
}
