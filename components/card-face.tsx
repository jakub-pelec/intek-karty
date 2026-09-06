import type { CSSProperties } from "react";
import type { Rarity } from "@/db/schema";
import { RARITY_LIGHT } from "@/lib/open-fx";
import { cn } from "@/lib/utils";

export type CardFaceProps = {
  name: string;
  imageUrl: string | null;
  rarity?: Rarity;
  holographic?: boolean;
  className?: string;
};

export function CardFace(props: CardFaceProps) {
  const rarity = props.rarity ?? "common";
  const holoStyle = {
    "--holo-tint": RARITY_LIGHT[rarity],
  } as CSSProperties;

  return (
    <div
      className={cn(
        "card-face relative h-full w-full overflow-hidden bg-[var(--surface-2)]",
        props.holographic && "card-face-holo",
        props.className,
      )}
    >
      {props.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={props.imageUrl}
          alt={props.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-3 text-center font-[family-name:var(--font-display)] text-lg text-[var(--muted)]">
          {props.name}
        </div>
      )}
      {props.holographic ? (
        <div
          className="card-holo-foil pointer-events-none absolute inset-0"
          style={holoStyle}
        />
      ) : null}
    </div>
  );
}
