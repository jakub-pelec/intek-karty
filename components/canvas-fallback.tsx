"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function CanvasFallback({ className }: { className?: string }) {
  const t = useTranslations("common");
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center",
        className,
      )}
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4b36a]/20 border-t-[#d4b36a]"
        aria-hidden
      />
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
