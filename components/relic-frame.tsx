import type { ReactNode } from "react";
import type { Rarity } from "@/db/schema";
import { RarityGem } from "@/components/rarity-gem";
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
  return (
    <div
      className={cn(
        "notched-frame relative aspect-[2/3] bg-[#b8c0c8] p-[2px] shadow-[0_20px_60px_-10px_rgba(26,22,48,0.9)]",
        sealed && "opacity-70",
        className,
      )}
    >
      <div className="notched-inner relative flex h-full w-full flex-col overflow-hidden bg-[#05040a]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1a1630_0%,transparent_70%)] opacity-50" />
        <div className="notched-inner pointer-events-none absolute inset-3 border border-[#b8c0c8]/30" />
        <div className="notched-inner pointer-events-none absolute inset-4 border border-[#b8c0c8]/10" />
        {children}
      </div>
      {rarity ? (
        <div className="absolute -bottom-1.5 left-1/2 z-20 h-4 w-4 -translate-x-1/2">
          <RarityGem rarity={rarity} />
        </div>
      ) : null}
    </div>
  );
}
