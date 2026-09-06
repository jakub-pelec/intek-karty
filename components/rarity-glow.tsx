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

export function CardBloom({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -inset-y-[22%] -inset-x-[36%] z-0",
        className,
      )}
      style={{
        background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${color} 55%, transparent) 0%, color-mix(in srgb, ${color} 22%, transparent) 38%, transparent 72%)`,
        filter: "blur(18px) saturate(1.25)",
      }}
    />
  );
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
