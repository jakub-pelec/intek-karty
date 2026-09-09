"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { openBoosterAction } from "@/actions/draw";
import { BoosterOpenOverlay } from "@/components/booster-open-overlay";
import { BoosterPackPreview } from "@/components/booster-pack-preview";
import { MutationBadges, RarityBadge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useOpenSequence } from "@/components/use-open-sequence";
import type { Rarity } from "@/db/schema";
import { cn, formatCardNumber } from "@/lib/utils";
import { useTranslations } from "next-intl";

type DrawnCard = {
  name: string;
  number: number;
  rarity: Rarity;
  imageUrl: string | null;
  holoMapUrl?: string | null;
  backImageUrl?: string | null;
  holographic: boolean;
  signature: boolean;
  isDuplicate: boolean;
  pointsAwarded: number;
  message: string;
};

export function BoosterOpenStage({
  userBoosterId,
  boosterName,
  viewerName,
  frontImageUrl,
  backImageUrl,
  initialDraw = null,
}: {
  userBoosterId: string;
  boosterName: string;
  viewerName: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  initialDraw?: DrawnCard | null;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const t = useTranslations("openPack");
  const tCommon = useTranslations("common");
  const { phase, card, started, begin, resolve, fail, isBusy } =
    useOpenSequence<DrawnCard>(initialDraw);

  function confirmOpen() {
    setError(null);
    setDismissed(false);
    begin();
    start(async () => {
      const result = await openBoosterAction(userBoosterId);
      if (result.error || !result.result) {
        fail();
        setError(result.error ?? t("couldNotOpen"));
        return;
      }
      resolve({
        name: result.result.card.name,
        number: result.result.card.number,
        rarity: result.result.card.rarity,
        imageUrl: result.result.card.imageUrl,
        holoMapUrl: result.result.card.holoMapUrl,
        backImageUrl: result.result.backImageUrl,
        holographic: result.result.holographic,
        signature: result.result.signature,
        isDuplicate: result.result.isDuplicate,
        pointsAwarded: result.result.pointsAwarded,
        message: result.success ?? t("opened"),
      });
    });
  }

  const opening = isBusy || pending;
  const overlayOpen = started && !dismissed;
  const showResult = Boolean(card) && (dismissed || Boolean(initialDraw && !started));

  return (
    <div className="mx-auto max-w-xl text-center">
      <h2 className="mb-8 font-[family-name:var(--font-cormorant)] text-[35px] tracking-wide text-[#cfc6b4] italic">
        {boosterName}
      </h2>
      {!overlayOpen && !showResult ? (
        <div className="overflow-hidden border border-[#d4b36a]/30 bg-[#05040a]">
          <BoosterPackPreview
            name={boosterName}
            frontImageUrl={frontImageUrl}
            backImageUrl={backImageUrl}
          />
        </div>
      ) : null}
      <BoosterOpenOverlay
        open={overlayOpen}
        name={boosterName}
        phase={phase}
        card={card}
        frontImageUrl={frontImageUrl}
        backImageUrl={backImageUrl}
        eyebrow={t("forViewer", { name: viewerName })}
        onDismiss={() => setDismissed(true)}
        details={
          card ? (
            <div className="text-center">
              <p className="text-xs tracking-[0.18em] text-[#cfc6b4] uppercase">
                {formatCardNumber(card.number)}
              </p>
              <h3 className="mt-1 font-[family-name:var(--font-display)] text-[35px] text-[#f3efe6]">
                {card.name}
              </h3>
              <div className="mt-3 flex justify-center gap-1">
                <RarityBadge rarity={card.rarity} />
                <MutationBadges holographic={card.holographic} signature={card.signature} />
              </div>
              {card.isDuplicate ? (
                <p className="mt-2 text-sm text-amber-200">
                  {t("duplicatePoints", { points: card.pointsAwarded })}
                </p>
              ) : null}
            </div>
          ) : null
        }
      />
      <p className="sr-only" aria-live="polite">
        {phase === "charge"
          ? t("openingPack")
          : phase === "burst"
            ? t("packBursting")
            : card
              ? t("revealed", { name: card.name })
              : ""}
      </p>
      {error ? (
        <p className="mt-4 border border-[#8b1e2d]/50 bg-[#1a0a0c] px-3 py-2 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.16em] text-[#f3efe6] uppercase">
          {error}
        </p>
      ) : null}
      {showResult && card ? (
        <div className="mt-8">
          <p className="font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.2em] text-[#d4b36a]/70 uppercase">
            {formatCardNumber(card.number)}
          </p>
          <h3 className="mt-2 font-[family-name:var(--font-cormorant)] text-[35px] text-[#f3efe6] italic">
            {card.name}
          </h3>
          <div className="mt-3 flex justify-center gap-3">
            <RarityBadge rarity={card.rarity} />
            <MutationBadges holographic={card.holographic} signature={card.signature} />
          </div>
          <p className="mt-3 text-sm text-[#d7d3c8]/60 italic">{card.message}</p>
          {card.isDuplicate ? (
            <p className="mt-1 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.16em] text-[#d4b36a] uppercase">
              {t("echoAwarded", { points: card.pointsAwarded })}
            </p>
          ) : null}
          <Link
            href="/admin/queue"
            className={cn(buttonVariants(), "mt-8")}
          >
            {t("backToQueue")}
          </Link>
        </div>
      ) : !overlayOpen ? (
        <div className="mt-8 flex justify-center gap-10">
          <Button size="lg" disabled={opening} onClick={confirmOpen}>
            {opening ? t("opening") : t("openPack")}
          </Button>
          <Link
            href="/admin/queue"
            className="inline-flex h-12 items-center font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.24em] text-[#d7d3c8] uppercase hover:text-[#d4b36a]"
          >
            {tCommon("cancel")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
