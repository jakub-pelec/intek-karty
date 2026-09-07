"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { BoosterOpenOverlay } from "@/components/booster-open-overlay";
import { BoosterPackPreview } from "@/components/booster-pack-preview";
import { useOpenSequence } from "@/components/use-open-sequence";
import type { OpenCard } from "@/components/booster-open-scene";
import type { Rarity } from "@/db/schema";
import { RARITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function BoosterOpenDemo({
  name,
  frontImageUrl,
  backImageUrl,
  cards,
}: {
  name: string;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  cards: OpenCard[];
}) {
  const [dismissed, setDismissed] = useState(false);
  const [rarity, setRarity] = useState<Rarity>("legendary");
  const [holographic, setHolographic] = useState(false);
  const t = useTranslations("openPack");
  const tRarity = useTranslations("rarity");
  const tDev = useTranslations("dev");
  const { phase, card: shown, started, begin, resolve, reset, isBusy } =
    useOpenSequence<OpenCard>();

  const selected = useMemo(() => {
    const match = cards.find((card) => card.rarity === rarity) ?? cards[0];
    if (!match) {
      return {
        name: t("unknown"),
        imageUrl: `/cards/${rarity}.svg`,
        rarity,
        holographic,
      } satisfies OpenCard;
    }
    return { ...match, holographic };
  }, [cards, rarity, holographic, t]);

  function play() {
    setDismissed(false);
    begin();
    window.setTimeout(() => resolve(selected), 180);
  }

  function dismiss() {
    setDismissed(true);
    reset();
  }

  return (
    <div>
      <div className="overflow-hidden bg-[#05040a]">
        <BoosterPackPreview
          name={name}
          frontImageUrl={frontImageUrl}
          backImageUrl={backImageUrl}
        />
      </div>
      <BoosterOpenOverlay
        open={started && !dismissed}
        name={name}
        phase={phase}
        card={shown}
        frontImageUrl={frontImageUrl}
        backImageUrl={backImageUrl}
        eyebrow={tDev("rehearsal", { rarity: tRarity(shown?.rarity ?? rarity) })}
        onDismiss={dismiss}
        details={
          shown ? (
            <h3 className="font-[family-name:var(--font-display)] text-[33px] text-[#f3efe6]">
              {shown.name}
            </h3>
          ) : null
        }
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {RARITIES.map((value) => (
          <button
            key={value}
            type="button"
            disabled={isBusy}
            onClick={() => setRarity(value)}
            className={cn(
              "font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.18em] uppercase transition-colors",
              rarity === value ? "text-[#d4b36a]" : "text-[#cfc6b4] hover:text-[#d4b36a]",
            )}
          >
            {tRarity(value)}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.16em] text-[#d7d3c8] uppercase">
          <input
            type="checkbox"
            checked={holographic}
            disabled={isBusy}
            onChange={(event) => setHolographic(event.target.checked)}
            className="accent-[#d4b36a]"
          />
          {t("holoSparks")}
        </label>
        <Button size="sm" disabled={isBusy || cards.length === 0} onClick={play}>
          {isBusy ? t("opening") : t("playOpening")}
        </Button>
      </div>
    </div>
  );
}
