import type { Rarity } from "@/db/schema";
import { RARITY_GEM } from "@/lib/ritual";
import { cn } from "@/lib/utils";

export function RarityGem({
  rarity,
  className,
}: {
  rarity: Rarity;
  className?: string;
}) {
  const gem = RARITY_GEM[rarity];
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-full w-full drop-shadow-md", className)}
      aria-hidden
    >
      {gem.shape === "circle" ? (
        <circle cx="12" cy="12" r="9" fill={gem.fill} />
      ) : null}
      {gem.shape === "triangle" ? (
        <polygon points="12,2 22,20 2,20" fill={gem.fill} />
      ) : null}
      {gem.shape === "square" ? (
        <rect x="4" y="4" width="16" height="16" fill={gem.fill} />
      ) : null}
      {gem.shape === "pentagon" ? (
        <polygon points="12,1 23,8 19,21 5,21 1,8" fill={gem.fill} />
      ) : null}
      {gem.shape === "hex" ? (
        <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill={gem.fill} />
      ) : null}
    </svg>
  );
}
