import type { CSSProperties } from "react";
import type { ReactNode } from "react";
import type { Rarity } from "@/db/schema";
import { RarityGem } from "@/components/rarity-gem";
import { rarityGlowColor, rarityGlowFilter } from "@/components/rarity-glow";
import { RARITY_LIGHT } from "@/lib/open-fx";
import { cn } from "@/lib/utils";

export function RelicFrame({
  children,
  rarity,
  holographic: _holographic,
  sealed,
  className,
}: {
  children: ReactNode;
  rarity?: Rarity;
  holographic?: boolean;
  sealed?: boolean;
  className?: string;
}) {
  const rim = !sealed && rarity ? RARITY_LIGHT[rarity] : "#b8c0c8";
  const rimStyle = {
    "--relic-rim": rim,
  } as CSSProperties;

  return (
    <div className={cn("relative", className)}>
      {!sealed && rarity ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-1px] z-0 rounded-[28px]"
          style={{
            background: rarityGlowColor(rarity),
            filter: "blur(7px) saturate(1.08)",
            opacity: 0.16,
          }}
        />
      ) : null}
      <div
        className="relative z-10"
        style={!sealed && rarity ? { filter: rarityGlowFilter(rarity) } : undefined}
      >
        <div
          className={cn(
            "notched-frame relative aspect-[2/3] bg-[var(--relic-rim)] p-[4px]",
            sealed && "opacity-70",
          )}
          style={rimStyle}
        >
          <div className="notched-inner relative flex h-full w-full flex-col overflow-hidden bg-[#05040a]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1a1630_0%,transparent_70%)] opacity-50" />
            <div
              className="notched-inner pointer-events-none absolute inset-3 border"
              style={{ borderColor: `color-mix(in srgb, ${rim} 35%, transparent)` }}
            />
            <div
              className="notched-inner pointer-events-none absolute inset-4 border"
              style={{ borderColor: `color-mix(in srgb, ${rim} 15%, transparent)` }}
            />
            {children}
          </div>
          {rarity ? (
            <div className="absolute -bottom-1.5 left-1/2 z-20 h-4 w-4 -translate-x-1/2">
              <RarityGem rarity={rarity} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
