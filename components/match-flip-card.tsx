"use client";

import { useEffect, useState } from "react";
import { CardFace } from "@/components/card-face";
import { RelicFrame } from "@/components/relic-frame";
import { ScoreNoteList } from "@/components/card-rules";
import type { VisibleSlot } from "@/lib/game/view-match";
import { toRoman } from "@/lib/ritual";
import { cn } from "@/lib/utils";

export function MatchFlipCard({
  slot,
  sealedLabel,
  animate,
  delayMs,
  selected,
  onSelect,
}: {
  slot: VisibleSlot;
  sealedLabel: string;
  animate: boolean;
  delayMs: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const card = slot.card;
  const [flipped, setFlipped] = useState(
    () => Boolean(card) && (!animate || !slot.revealed),
  );

  useEffect(() => {
    if (!slot.revealed || !card) {
      setFlipped(Boolean(card));
      return;
    }
    if (!animate) {
      setFlipped(true);
      return;
    }
    setFlipped(false);
    let timeout: number | undefined;
    const frame = window.requestAnimationFrame(() => {
      timeout = window.setTimeout(() => setFlipped(true), delayMs);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [slot.revealed, slot.slot, card?.cardId, animate, delayMs]);

  const back = (
    <RelicFrame sealed className="h-full">
      {slot.backImageUrl ? (
        <CardFace
          name={sealedLabel}
          imageUrl={slot.backImageUrl}
          className="opacity-40"
          sizes="(max-width: 768px) 30vw, 12vw"
        />
      ) : (
        <div className="absolute inset-0 bg-[#05040a]" />
      )}
      <div className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center bg-[#05040a]/45">
        <span className="font-[family-name:var(--font-cinzel)] text-[18px] tracking-[0.2em] text-[#d7d3c8]/70">
          {toRoman(slot.slot)}
        </span>
      </div>
    </RelicFrame>
  );

  const face = card ? (
    <RelicFrame rarity={card.rarity} holographic={card.holographic} className="h-full">
      <CardFace
        name={card.name}
        imageUrl={card.imageUrl}
        rarity={card.rarity}
        holographic={card.holographic}
        sizes="(max-width: 768px) 30vw, 12vw"
      />
    </RelicFrame>
  ) : null;

  const peek = Boolean(card) && !slot.revealed;
  const showIdentity = flipped || peek;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn("w-full text-left", selected && "opacity-100")}
    >
      <div className="match-card-scene">
        {face ? (
          <div
            className={cn("match-card-pivot", showIdentity && "is-flipped")}
          >
            <div className="match-card-face match-card-back">{back}</div>
            <div className={cn("match-card-face match-card-front", peek && "opacity-80")}>
              {face}
            </div>
          </div>
        ) : (
          back
        )}
      </div>
      <p className="mt-3 truncate text-center font-[family-name:var(--font-cormorant)] text-lg italic text-[#d7d3c8]">
        {showIdentity && card ? card.name : sealedLabel}
      </p>
      {showIdentity && slot.row ? (
        <p className="text-center font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.16em] text-[#d4b36a] uppercase">
          {slot.row.subtotal}
          {slot.row.effect > 0 ? ` · +${slot.row.effect}` : ""}
        </p>
      ) : null}
      {selected && showIdentity && slot.row ? (
        <div className="mt-2 md:hidden">
          <ScoreNoteList notes={slot.row.notes} />
        </div>
      ) : null}
    </button>
  );
}
