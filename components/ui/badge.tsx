"use client";

import type { HTMLAttributes } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Rarity } from "@/db/schema";

const rarityClass: Record<Rarity, string> = {
  common: "text-[#c5cedb]",
  rare: "text-[#4d7fd6]",
  epic: "text-[#c46bff]",
  legendary: "text-[#edc24a]",
  joker: "text-[#ff4d94]",
};

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.16em] uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function MutationBadges({
  holographic,
  signature,
}: {
  holographic?: boolean;
  signature?: boolean;
}) {
  const t = useTranslations("common");
  if (!holographic && !signature) return null;
  return (
    <span className="inline-flex flex-wrap gap-2">
      {holographic ? (
        <Badge className="text-[#7ef0e0]">{t("holo")}</Badge>
      ) : null}
      {signature ? (
        <Badge className="text-[#d4b36a]">{t("signed")}</Badge>
      ) : null}
    </span>
  );
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  const t = useTranslations("rarity");
  return <Badge className={rarityClass[rarity]}>{t(rarity)}</Badge>;
}
