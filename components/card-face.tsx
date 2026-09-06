import Image from "next/image";
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
  priority?: boolean;
  sizes?: string;
};

const GRID_SIZES =
  "(max-width: 768px) 46vw, (max-width: 1280px) 32vw, 22vw";

export function CardFace(props: CardFaceProps) {
  const rarity = props.rarity ?? "common";
  const holoStyle = {
    "--holo-tint": RARITY_LIGHT[rarity],
  } as CSSProperties;

  return (
    <div
      className={cn(
        "card-face absolute inset-0 overflow-hidden bg-[var(--surface-2)]",
        props.holographic && "card-face-holo",
        props.className,
      )}
    >
      {props.imageUrl ? (
        <Image
          src={props.imageUrl}
          alt={props.name}
          fill
          sizes={props.sizes ?? GRID_SIZES}
          priority={props.priority}
          className="object-cover"
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
