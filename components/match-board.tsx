"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  revealAllAction,
  revealNextAction,
  rewindRevealAction,
} from "@/actions/match";
import { CardRulesText, ScoreNoteList } from "@/components/card-rules";
import { MatchFlipCard } from "@/components/match-flip-card";
import { Button } from "@/components/ui/button";
import { DECK_SIZE } from "@/lib/game/types";
import type { MatchPayload, MatchSideView } from "@/lib/game/view-match";
import { cn } from "@/lib/utils";

function SideRow({
  side,
  sealedLabel,
  animateFrom,
  focusKey,
  onFocus,
}: {
  side: MatchSideView;
  sealedLabel: string;
  animateFrom: number;
  focusKey: string | null;
  onFocus: (key: string) => void;
}) {
  const t = useTranslations("match");
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] text-[#f3efe6] italic md:text-[32px]">
          {side.name}
          {side.isYou ? ` · ${t("you")}` : ""}
        </h2>
        <p className="font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.2em] text-[#d4b36a] uppercase">
          {t("ratingScore", { rating: side.rating, score: side.score })}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 md:grid-cols-6 md:gap-5">
        {side.slots.map((slot) => {
          const key = `${side.isYou ? "you" : "them"}-${slot.slot}`;
          const animate = slot.revealed && slot.slot > animateFrom;
          return (
            <MatchFlipCard
              key={slot.slot}
              slot={slot}
              sealedLabel={sealedLabel}
              animate={animate}
              delayMs={animate ? (slot.slot - animateFrom - 1) * 90 : 0}
              selected={focusKey === key}
              onSelect={() => onFocus(key)}
            />
          );
        })}
      </div>
    </section>
  );
}

function Ledger({
  side,
  focusKey,
  prefix,
  onFocus,
}: {
  side: MatchSideView;
  focusKey: string | null;
  prefix: "you" | "them";
  onFocus: (key: string) => void;
}) {
  const t = useTranslations("match");
  return (
    <div className="space-y-4">
      <p className="font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.24em] text-[#d7d3c8]/40 uppercase">
        {side.name}
        {side.isYou ? ` · ${t("you")}` : ""} · {side.score}
      </p>
      {side.rows.length === 0 ? (
        <p className="font-[family-name:var(--font-cormorant)] text-base text-[#d7d3c8]/45 italic">
          {t("noRevealed")}
        </p>
      ) : (
        <ul className="space-y-4">
          {side.rows.map((row, index) => {
            const key = `${prefix}-${index + 1}`;
            const active = focusKey === key;
            return (
              <li key={row.cardId}>
                <button
                  type="button"
                  onClick={() => onFocus(key)}
                  className={cn(
                    "w-full text-left",
                    active ? "text-[#d4b36a]" : "text-[#d7d3c8]",
                  )}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-[family-name:var(--font-cormorant)] text-lg italic">
                      {row.name}
                    </span>
                    <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.14em] uppercase">
                      {row.subtotal}
                    </span>
                  </span>
                </button>
                <ScoreNoteList notes={row.notes} className="mt-1" />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function MatchBoard({
  payload,
  eyebrow,
}: {
  payload: MatchPayload;
  eyebrow: string;
}) {
  const t = useTranslations("match");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [godView, setGodView] = useState(false);
  const [auto, setAuto] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const shown = godView && payload.god ? payload.god : payload.view;
  const them = shown.youAre === "b" ? shown.playerA : shown.playerB;
  const you = shown.youAre === "b" ? shown.playerB : shown.playerA;
  const finished = shown.status === "finished";
  const shade = shown.kind === "practice";
  const prevRevealed = useRef(shown.revealedCount);
  const animateFrom =
    shown.revealedCount > prevRevealed.current ? prevRevealed.current : shown.revealedCount;

  useEffect(() => {
    prevRevealed.current = shown.revealedCount;
  }, [shown.revealedCount]);

  function run(
    action: (id: string) => Promise<{ error?: string; success?: boolean }>,
  ) {
    start(async () => {
      const result = await action(shown.id);
      if ("error" in result) setMessage(result.error ?? null);
      else {
        setMessage(null);
        router.refresh();
      }
    });
  }

  useEffect(() => {
    if (!auto || pending || finished || !payload.canReveal) return;
    const id = shown.id;
    const timer = window.setTimeout(() => {
      start(async () => {
        const result = await revealNextAction(id);
        if ("error" in result) setMessage(result.error ?? null);
        else {
          setMessage(null);
          router.refresh();
        }
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [auto, pending, finished, payload.canReveal, shown.revealedCount, shown.id, router]);

  useEffect(() => {
    if (finished) setAuto(false);
  }, [finished]);

  const winnerLabel = (() => {
    if (!finished || !shown.winnerSide) return null;
    if (shown.winnerSide === "draw") return t("draw");
    const youWon =
      (shown.youAre === "a" && shown.winnerSide === "a") ||
      (shown.youAre === "b" && shown.winnerSide === "b");
    if (shown.youAre === "spectator") {
      return t("winner", {
        name: shown.winnerSide === "a" ? shown.playerA.name : shown.playerB.name,
      });
    }
    return youWon ? t("youWin") : t("youLose");
  })();

  const yourDelta =
    shown.youAre === "a"
      ? shown.ratingDeltaA
      : shown.youAre === "b"
        ? shown.ratingDeltaB
        : null;

  const focusedSlot = [...them.slots, ...you.slots].find((slot, index) => {
    const prefix = index < them.slots.length ? "them" : "you";
    const slotIndex = index < them.slots.length ? index : index - them.slots.length;
    return focusKey === `${prefix}-${slotIndex + 1}`;
  });
  const focusedCard = focusedSlot?.card ?? null;

  const themNamed = { ...them, name: shade ? t("shade") : them.name };

  return (
    <div className="relative grid grid-cols-1 items-start gap-5 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-x-10 md:gap-y-0 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-x-16">
      <div className="relative z-10 min-w-0 text-center md:col-start-2 md:row-start-1 md:mb-1 md:text-left">
        <div className="flex flex-col justify-between md:flex-row md:items-end">
          <h1 className="font-[family-name:var(--font-cormorant)] text-[42px] tracking-wide text-[#cfc6b4] italic md:text-[55px]">
            {t("title")}
          </h1>
          <p className="mt-3 font-[family-name:var(--font-cinzel)] text-[14px] tracking-[0.3em] text-[#d4b36a] uppercase md:mt-0">
            {t("progress", { revealed: shown.revealedCount, total: DECK_SIZE })}
          </p>
        </div>
        <p className="mt-2 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.2em] text-[#d7d3c8]/55 uppercase">
          {eyebrow}
          {shown.kind === "ranked" ? ` · ${t("ranked")}` : ` · ${t("practice")}`}
        </p>
        {winnerLabel ? (
          <p className="mt-2 font-[family-name:var(--font-cormorant)] text-[24px] text-[#f3efe6] italic">
            {winnerLabel}
            {finished && shown.kind === "ranked" && yourDelta != null
              ? ` · ${t("ratingDelta", { delta: yourDelta > 0 ? `+${yourDelta}` : `${yourDelta}` })}`
              : ""}
          </p>
        ) : null}
      </div>

      <aside className="relative z-10 flex w-full min-w-0 flex-col items-center gap-3 md:col-start-1 md:row-span-2 md:row-start-1 md:items-start md:gap-0 md:pr-8 lg:pr-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-[#d4b36a] to-transparent md:block"
        />
        <h2 className="hidden font-[family-name:var(--font-cormorant)] text-[55px] tracking-wide text-[#cfc6b4] italic md:mb-1 md:block">
          {t("ledger")}
        </h2>
        <div className="flex w-full flex-col items-center gap-5 md:items-start md:gap-8">
          <div className="flex w-full flex-col items-center gap-2 md:items-start">
            <Button
              type="button"
              disabled={pending || !payload.canReveal}
              onClick={() => run(revealNextAction)}
              className="w-full md:w-auto"
            >
              {t("revealNext")}
            </Button>
            {payload.canDevControl ? (
              <div className="flex flex-wrap items-center justify-center gap-2 md:flex-col md:items-start">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pending || finished}
                  onClick={() => run(revealAllAction)}
                >
                  {t("revealAll")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pending || (shown.revealedCount <= 0 && !finished)}
                  onClick={() => run(rewindRevealAction)}
                >
                  {t("rewind")}
                </Button>
                <Button
                  type="button"
                  variant={godView ? "primary" : "secondary"}
                  size="sm"
                  disabled={!payload.god}
                  onClick={() => setGodView((value) => !value)}
                >
                  {godView ? t("godOn") : t("godOff")}
                </Button>
                <Button
                  type="button"
                  variant={auto ? "primary" : "secondary"}
                  size="sm"
                  disabled={finished || !payload.canReveal}
                  onClick={() => setAuto((value) => !value)}
                >
                  {auto ? t("autoOn") : t("autoOff")}
                </Button>
              </div>
            ) : null}
          </div>
          {message ? (
            <p className="font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.16em] text-[#ffb4c0] uppercase">
              {message}
            </p>
          ) : null}
          <div className="hidden w-full md:block">
            <Ledger
              side={themNamed}
              focusKey={focusKey}
              prefix="them"
              onFocus={setFocusKey}
            />
          </div>
          <div className="hidden w-full md:block">
            <Ledger side={you} focusKey={focusKey} prefix="you" onFocus={setFocusKey} />
          </div>
          {focusedCard ? (
            <div className="hidden w-full border-t border-[#d4b36a]/20 pt-5 md:block">
              <p className="mb-2 font-[family-name:var(--font-cormorant)] text-xl italic text-[#f3efe6]">
                {focusedCard.name}
              </p>
              <CardRulesText
                tags={focusedCard.tags}
                effectKind={focusedCard.effectKind}
                effectTag={focusedCard.effectTag}
                effectValue={focusedCard.effectValue}
                effectThreshold={focusedCard.effectThreshold}
                holographic={focusedCard.holographic}
                signed={focusedCard.signed}
                basePoints={focusedCard.basePoints}
              />
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => router.push("/deck")}
            className="font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.24em] text-[#d7d3c8]/70 uppercase hover:text-[#d4b36a]"
          >
            {t("backToDeck")}
          </button>
        </div>
      </aside>

      <div className="relative min-w-0 md:col-start-2 md:row-start-2">
        <div className="relative z-10 space-y-12 border border-[#d4b36a]/25 bg-[#05040a]/45 px-4 py-6 sm:px-10 sm:py-12">
          <SideRow
            side={themNamed}
            sealedLabel={t("sealed")}
            animateFrom={animateFrom}
            focusKey={focusKey}
            onFocus={setFocusKey}
          />
          <SideRow
            side={you}
            sealedLabel={t("sealed")}
            animateFrom={animateFrom}
            focusKey={focusKey}
            onFocus={setFocusKey}
          />
        </div>
      </div>
    </div>
  );
}
