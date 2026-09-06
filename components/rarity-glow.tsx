import type { Rarity } from "@/db/schema";
import { RARITY_LIGHT } from "@/lib/open-fx";
import { cn } from "@/lib/utils";

export function rarityGlowColor(rarity: Rarity) {
  return `color-mix(in srgb, ${RARITY_LIGHT[rarity]} 88%, white)`;
}

export function rarityGlowFilter(rarity: Rarity) {
  const glow = rarityGlowColor(rarity);
  return `saturate(1.1) drop-shadow(0 0 3px color-mix(in srgb, ${glow} 32%, transparent)) drop-shadow(0 0 1px color-mix(in srgb, ${glow} 70%, transparent))`;
}

export function RarityGlow({
  rarity,
  className,
}: {
  rarity?: Rarity | null;
  className?: string;
}) {
  if (!rarity) return null;
  const glow = rarityGlowColor(rarity);
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 z-0", className)}
      style={{
        filter: "saturate(1.55)",
        boxShadow: `0 0 1px 3px ${glow}, 0 0 2px 7px color-mix(in srgb, ${glow} 10%, transparent)`,
      }}
    />
  );
}
