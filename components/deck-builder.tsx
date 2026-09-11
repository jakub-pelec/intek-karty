"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createDeckAction,
  deleteDeckAction,
  renameDeckAction,
  saveDeckSlotsAction,
  setActiveDeckAction,
} from "@/actions/deck";
import {
  startPracticeMatchAction,
  startRankedMatchAction,
} from "@/actions/match";
import { CardFace } from "@/components/card-face";
import { CardInspect } from "@/components/card-inspect";
import { CardRulesText } from "@/components/card-rules";
import { RelicFrame } from "@/components/relic-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RARITIES } from "@/lib/constants";
import {
  DEFAULT_DECK_POOL_QUERY,
  DECK_POOL_SORTS,
  filterDeckPool,
  filledSlotCount,
  lineupRarityCounts,
  lineupTagCounts,
  setDeckEffect,
  setDeckSort,
  toggleDeckRarity,
  toggleDeckTag,
  type DeckPoolQuery,
} from "@/lib/game/deck-pool";
import { scoreLineup } from "@/lib/game/score";
import { toPlayCard, type DeckSummary, type OwnedDeckCard } from "@/lib/game/play-card";
import { CARD_TAGS, DECK_SIZE, EFFECT_KINDS } from "@/lib/game/types";
import { RARITY_LIGHT } from "@/lib/open-fx";
import { toRoman } from "@/lib/ritual";
import { cn } from "@/lib/utils";

const EFFECT_KIND_KEYS = {
  per_tag: "effectKind.per_tag",
  tribe: "effectKind.tribe",
  lone: "effectKind.lone",
  high_rarity: "effectKind.high_rarity",
} as const;

const SORT_KEYS = {
  points: "sortPoints",
  rarity: "sortRarity",
  name: "sortName",
} as const;

function InspectLedgerRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#d4b36a]/15 py-3 last:border-b-0">
      <span className="font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.2em] text-[#d4b36a]/70 uppercase">
        {label}
      </span>
      <span
        className={cn(
          "font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.24em] uppercase",
          valueClassName ?? "text-[#d7d3c8]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function FilterChip({
  active,
  onSelect,
  children,
}: {
  active: boolean;
  onSelect: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        "ritual-ember self-center border-b pb-0.5 font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.16em] uppercase md:self-start md:text-[13px] md:tracking-[0.24em]",
        active
          ? "border-[#d4b36a] text-[#d4b36a]"
          : "border-transparent text-[#d7d3c8]/40 hover:border-[#d4b36a]/50",
      )}
    >
      {children}
    </button>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 md:items-start md:gap-3">
      <span className="font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.24em] text-[#d7d3c8]/40 uppercase">
        {label}
      </span>
      <div className="flex flex-row flex-wrap items-center justify-center gap-x-3 gap-y-1.5 md:flex-col md:items-start md:justify-start md:gap-3">
        {children}
      </div>
    </div>
  );
}

export function DeckBuilder({
  owned,
  decks,
  selectedDeckId,
  rating,
  openMatchId,
}: {
  owned: OwnedDeckCard[];
  decks: DeckSummary[];
  selectedDeckId: string | null;
  rating: number;
  openMatchId: string | null;
}) {
  const t = useTranslations("deck");
  const tMatch = useTranslations("match");
  const tTag = useTranslations("cardTag");
  const tRarity = useTranslations("rarity");
  const tCollection = useTranslations("collection");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  const selected = decks.find((deck) => deck.id === selectedDeckId) ?? null;
  const [slots, setSlots] = useState<(string | null)[]>(
    selected?.slots ?? Array.from({ length: DECK_SIZE }, () => null),
  );
  const [name, setName] = useState(selected?.name ?? "");
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [poolQuery, setPoolQuery] = useState<DeckPoolQuery>(DEFAULT_DECK_POOL_QUERY);
  const [syncedDeckId, setSyncedDeckId] = useState(selected?.id ?? null);
  if ((selected?.id ?? null) !== syncedDeckId) {
    setSyncedDeckId(selected?.id ?? null);
    setSlots(selected?.slots ?? Array.from({ length: DECK_SIZE }, () => null));
    setName(selected?.name ?? "");
    setInspectId(null);
    setMessage(null);
  }

  useEffect(() => {
    if (!inspectId) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setInspectId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inspectId]);

  const ownedById = useMemo(
    () => new Map(owned.map((card) => [card.cardId, card])),
    [owned],
  );
  const filled = slots
    .map((id) => (id ? ownedById.get(id) : null))
    .filter((card): card is OwnedDeckCard => Boolean(card));
  const score = scoreLineup(filled.map(toPlayCard));
  const inDeck = new Set(slots.filter((id): id is string => Boolean(id)));
  const inspected = inspectId ? (ownedById.get(inspectId) ?? null) : null;
  const visible = useMemo(
    () => filterDeckPool(owned, poolQuery),
    [owned, poolQuery],
  );
  const rarityCounts = lineupRarityCounts(filled);
  const tagCounts = lineupTagCounts(filled);
  const seated = filled.length;
  const queueReady = decks.some((deck) => deck.isActive);
  const roomLeft = seated < DECK_SIZE;
  const inspectedInDeck = inspected ? inDeck.has(inspected.cardId) : false;
  const priorityIndexes = new Set(
    visible.slice(0, 2).map((_, index) => index),
  );

  function persist(next: (string | null)[]) {
    if (!selected) return;
    setSlots(next);
    start(async () => {
      const result = await saveDeckSlotsAction(selected.id, next);
      if ("error" in result) setMessage(result.error ?? null);
      else {
        setMessage(null);
        router.refresh();
      }
    });
  }

  function addCard(cardId: string) {
    if (!selected || inDeck.has(cardId)) return;
    const empty = slots.findIndex((id) => !id);
    if (empty < 0) return;
    const next = [...slots];
    next[empty] = cardId;
    persist(next);
    setInspectId(null);
  }

  function removeCard(cardId: string) {
    if (!selected) return;
    persist(slots.map((id) => (id === cardId ? null : id)));
    setInspectId(null);
  }

  function go(deckId: string) {
    router.push(`/deck?deck=${deckId}`);
  }

  function activate(deckId: string) {
    start(async () => {
      const result = await setActiveDeckAction(deckId);
      if ("error" in result) setMessage(result.error ?? null);
      else router.refresh();
    });
  }

  function goMatch(
    action: () => Promise<{ error?: string; matchId?: string }>,
  ) {
    start(async () => {
      const result = await action();
      if ("error" in result) setMessage(result.error ?? null);
      else if (result.matchId) router.push(`/match/${result.matchId}`);
    });
  }

  return (
    <>
      <div className="relative grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:gap-x-16 lg:gap-y-0">
        <div className="relative z-10 min-w-0 text-center lg:col-start-2 lg:row-start-1 lg:mb-6 lg:text-left">
          <h1 className="font-[family-name:var(--font-cormorant)] text-[42px] tracking-wide text-[#cfc6b4] italic md:text-[55px]">
            {t("title")}
          </h1>
          <p className="mt-3 font-[family-name:var(--font-cinzel)] text-[14px] tracking-[0.3em] text-[#d4b36a] uppercase">
            {t("eyebrow", { count: decks.length })}
          </p>
        </div>

        <aside className="relative z-10 flex w-full min-w-0 flex-col items-center gap-8 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:items-start lg:gap-10 lg:pr-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-[#d4b36a] to-transparent lg:block"
          />

          <FilterGroup label={t("lineups")}>
            {decks.map((deck) => {
              const isSelected = deck.id === selected?.id;
              const full =
                filledSlotCount(isSelected ? slots : deck.slots) === DECK_SIZE;
              return (
                <div
                  key={deck.id}
                  className="flex w-full items-baseline justify-center gap-3 lg:justify-between"
                >
                  <button
                    type="button"
                    onClick={() => go(deck.id)}
                    className={cn(
                      "ritual-ember min-w-0 truncate border-b pb-0.5 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.24em] uppercase",
                      isSelected
                        ? "border-[#d4b36a] text-[#d4b36a]"
                        : "border-transparent text-[#d7d3c8] hover:border-[#d4b36a]/50",
                    )}
                  >
                    {deck.name}
                  </button>
                  {deck.isActive ? (
                    <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.2em] text-[#d4b36a] uppercase">
                      {t("queueReady")}
                    </span>
                  ) : full ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => activate(deck.id)}
                      className="ritual-ember shrink-0 border-b border-transparent pb-0.5 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.2em] text-[#d7d3c8]/50 uppercase hover:border-[#d4b36a]/50 hover:text-[#d4b36a]"
                    >
                      {t("setActive")}
                    </button>
                  ) : (
                    <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.2em] text-[#d7d3c8]/30 uppercase">
                      —
                    </span>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await createDeckAction();
                  if ("error" in result) setMessage(result.error ?? null);
                  if ("deckId" in result) router.push(`/deck?deck=${result.deckId}`);
                  router.refresh();
                })
              }
              className="ritual-ember border-b border-transparent pb-0.5 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.24em] text-[#d7d3c8]/40 uppercase hover:border-[#d4b36a]/50 hover:text-[#d4b36a]"
            >
              {t("newDeck")}
            </button>
          </FilterGroup>

          {selected ? (
            <div className="flex w-full max-w-xs flex-col items-center gap-3 lg:max-w-none lg:items-stretch">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => {
                  if (name.trim() && name.trim() !== selected.name) {
                    start(async () => {
                      const result = await renameDeckAction(selected.id, name);
                      if ("error" in result) setMessage(result.error ?? null);
                      else router.refresh();
                    });
                  }
                }}
                aria-label={t("rename")}
              />
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const result = await deleteDeckAction(selected.id);
                    if ("error" in result) setMessage(result.error ?? null);
                    else {
                      router.push("/deck");
                      router.refresh();
                    }
                  })
                }
              >
                {t("delete")}
              </Button>
            </div>
          ) : null}

          <div className="flex w-full flex-col items-center gap-3 lg:items-stretch">
            <p className="font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.2em] text-[#d4b36a]/80 uppercase">
              {tMatch("yourRating", { rating })}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {openMatchId ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={() => router.push(`/match/${openMatchId}`)}
                >
                  {tMatch("resume")}
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                disabled={pending || !queueReady}
                onClick={() => goMatch(startRankedMatchAction)}
              >
                {tMatch("findOpponent")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending || !queueReady}
                onClick={() => goMatch(startPracticeMatchAction)}
              >
                {tMatch("practice")}
              </Button>
            </div>
            {message ? (
              <p className="font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.16em] text-[#ffb4c0] uppercase">
                {message}
              </p>
            ) : null}
          </div>

          {selected ? (
            <div className="flex w-full flex-col items-center gap-4 text-center lg:items-start lg:text-left">
              <span className="font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.24em] text-[#d7d3c8]/40 uppercase">
                {t("summary")}
              </span>
              <p className="font-[family-name:var(--font-cormorant)] text-[48px] leading-none tracking-wide text-[#cfc6b4] italic">
                {t("score", { total: score.total })}
              </p>
              <p className="font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.2em] text-[#d4b36a] uppercase">
                {t("seated", { filled: seated, total: DECK_SIZE })}
              </p>
              {rarityCounts.length ? (
                <ul className="space-y-1">
                  {rarityCounts.map((row) => (
                    <li
                      key={row.rarity}
                      className="font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.2em] uppercase"
                      style={{ color: RARITY_LIGHT[row.rarity] }}
                    >
                      {tRarity(row.rarity)} {row.count}
                    </li>
                  ))}
                </ul>
              ) : null}
              {tagCounts.length ? (
                <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  {tagCounts.map((row) => (
                    <span
                      key={row.tag}
                      className="border border-[#d4b36a]/25 px-2 py-1 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.16em] text-[#d7d3c8] uppercase"
                    >
                      {tTag(row.tag)} {row.count}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-center font-[family-name:var(--font-cormorant)] text-lg text-[#d7d3c8]/60 italic lg:text-left">
              {t("empty")}
            </p>
          )}

          <div className="flex w-full flex-col items-center gap-6 md:gap-10 lg:items-start">
            <FilterGroup label={tCollection("rarity")}>
              <FilterChip
                active={poolQuery.rarities.length === 0}
                onSelect={() => setPoolQuery((current) => ({ ...current, rarities: [] }))}
              >
                {tCollection("anyRarity")}
              </FilterChip>
              {RARITIES.map((rarity) => (
                <FilterChip
                  key={rarity}
                  active={poolQuery.rarities.includes(rarity)}
                  onSelect={() => setPoolQuery((current) => toggleDeckRarity(current, rarity))}
                >
                  {tRarity(rarity)}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup label={t("type")}>
              <FilterChip
                active={poolQuery.tags.length === 0}
                onSelect={() => setPoolQuery((current) => ({ ...current, tags: [] }))}
              >
                {t("anyType")}
              </FilterChip>
              {CARD_TAGS.map((tag) => (
                <FilterChip
                  key={tag}
                  active={poolQuery.tags.includes(tag)}
                  onSelect={() => setPoolQuery((current) => toggleDeckTag(current, tag))}
                >
                  {tTag(tag)}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup label={t("effect")}>
              <FilterChip
                active={poolQuery.effect === null}
                onSelect={() => setPoolQuery((current) => setDeckEffect(current, null))}
              >
                {t("anyEffect")}
              </FilterChip>
              {EFFECT_KINDS.map((kind) => (
                <FilterChip
                  key={kind}
                  active={poolQuery.effect === kind}
                  onSelect={() => setPoolQuery((current) => setDeckEffect(current, kind))}
                >
                  {t(EFFECT_KIND_KEYS[kind])}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup label={tCollection("sort")}>
              {DECK_POOL_SORTS.map((sort) => (
                <FilterChip
                  key={sort}
                  active={poolQuery.sort === sort}
                  onSelect={() => setPoolQuery((current) => setDeckSort(current, sort))}
                >
                  {t(SORT_KEYS[sort])}
                </FilterChip>
              ))}
            </FilterGroup>
          </div>
        </aside>

        <div className="relative min-w-0 lg:col-start-2 lg:row-start-2">
          <div className="collection-vault-well relative z-10 space-y-12">
            {selected ? (
              <section>
                <h2 className="mb-6 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.3em] text-[#d4b36a]/80 uppercase">
                  {t("currentLineup")}
                </h2>
                <div className="grid grid-cols-3 gap-4 md:grid-cols-6 md:gap-6">
                  {slots.map((cardId, index) => {
                    const card = cardId ? ownedById.get(cardId) : null;
                    if (!card) {
                      return (
                        <div key={index}>
                          <RelicFrame sealed>
                            <div className="flex h-full items-center justify-center font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.2em] text-[#d7d3c8]/40 uppercase">
                              {toRoman(index + 1)}
                            </div>
                          </RelicFrame>
                          <p className="mt-3 truncate text-center font-[family-name:var(--font-cormorant)] text-lg italic text-[#d7d3c8]">
                            {t("emptySlot")}
                          </p>
                          <p className="text-center font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.16em] text-[#d7d3c8]/40 uppercase">
                            {t("sealed")}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={card.cardId}
                        type="button"
                        onClick={() => setInspectId(card.cardId)}
                        className="text-left"
                      >
                        <RelicFrame rarity={card.rarity} holographic={card.holographic}>
                          <CardFace
                            name={card.name}
                            imageUrl={card.imageUrl}
                            rarity={card.rarity}
                            holographic={card.holographic}
                          />
                        </RelicFrame>
                        <p className="mt-3 truncate text-center font-[family-name:var(--font-cormorant)] text-lg italic text-[#d7d3c8]">
                          {card.name}
                        </p>
                        <p className="text-center font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.16em] text-[#d4b36a]/80 uppercase">
                          {t("points", { count: card.basePoints })}
                          {card.tags.length
                            ? ` · ${card.tags.map((tag) => tTag(tag)).join(" · ")}`
                            : ""}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section>
              <h2 className="mb-6 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.3em] text-[#d4b36a]/80 uppercase">
                {t("pool")}
              </h2>
              <div className="border border-[#d4b36a]/25 bg-[#05040a]/45 px-4 py-6 sm:px-10 sm:py-12">
                {owned.length === 0 ? (
                  <p className="py-16 text-center font-[family-name:var(--font-cormorant)] text-lg text-[#d7d3c8]/50 italic">
                    {t("noCards")}
                  </p>
                ) : visible.length === 0 ? (
                  <p className="py-16 text-center font-[family-name:var(--font-cormorant)] text-lg text-[#d7d3c8]/50 italic">
                    {t("noMatch")}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-[64px] lg:grid-cols-3 lg:gap-x-10 lg:gap-y-[80px]">
                    {visible.map((card, index) => {
                      const seatedCard = inDeck.has(card.cardId);
                      return (
                        <button
                          key={card.cardId}
                          type="button"
                          onClick={() => setInspectId(card.cardId)}
                          className={cn("text-left", seatedCard && "opacity-45")}
                        >
                          <RelicFrame rarity={card.rarity} holographic={card.holographic}>
                            <CardFace
                              name={card.name}
                              imageUrl={card.imageUrl}
                              rarity={card.rarity}
                              holographic={card.holographic}
                              priority={priorityIndexes.has(index)}
                            />
                          </RelicFrame>
                          <p className="mt-3 truncate text-center font-[family-name:var(--font-cormorant)] text-lg italic text-[#d7d3c8]">
                            {card.name}
                          </p>
                          <p className="text-center font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.16em] text-[#d4b36a]/70 uppercase">
                            {seatedCard
                              ? t("inDeck")
                              : t("points", { count: card.basePoints })}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {inspected ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-[#05040a]/80 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
          onClick={() => setInspectId(null)}
        >
          <div
            className="relative my-auto flex w-full max-w-6xl flex-col items-center gap-5 overflow-y-auto border border-[#d4b36a]/35 bg-[#0c0b12] px-5 py-5 sm:max-h-none sm:flex-row sm:items-center sm:gap-14 sm:overflow-visible sm:px-14 sm:py-14"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label={tCommon("close")}
              className="absolute top-3 right-3 z-20 p-1 text-[#d4b36a] hover:text-[#e8cf8a] sm:top-5 sm:right-5"
              onClick={() => setInspectId(null)}
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                background: `radial-gradient(ellipse 56% 92% at 50% 112%, color-mix(in srgb, ${RARITY_LIGHT[inspected.rarity]} 32%, transparent) 0%, color-mix(in srgb, ${RARITY_LIGHT[inspected.rarity]} 14%, transparent) 42%, transparent 78%)`,
              }}
            />
            <CardInspect
              className="relative z-10 w-[min(16rem,70vw)] shrink-0 sm:w-[28rem] lg:w-[32rem]"
              name={inspected.name}
              number={inspected.number}
              imageUrl={inspected.imageUrl}
              holoMapUrl={inspected.holoMapUrl}
              rarity={inspected.rarity}
              holographic={inspected.holographic}
              signature={inspected.signed}
              glow={false}
            />
            <div className="relative z-10 min-w-0 w-full flex-1 space-y-5 text-center sm:space-y-8 sm:text-left">
              <div className="space-y-3 sm:space-y-4">
                <p className="font-[family-name:var(--font-cinzel)] text-xs tracking-[0.2em] text-[#d7d3c8]/70 uppercase">
                  {toRoman(inspected.number)}
                </p>
                <h2 className="font-[family-name:var(--font-cormorant)] text-[42px] leading-none text-[#f3efe6] italic sm:text-[74px]">
                  {inspected.name}
                </h2>
              </div>
              {inspected.description ? (
                <p className="text-lg leading-relaxed text-[#d7d3c8]">
                  {inspected.description}
                </p>
              ) : null}
              <CardRulesText
                tags={inspected.tags}
                effectKind={inspected.effectKind}
                effectTag={inspected.effectTag}
                effectValue={inspected.effectValue}
                effectThreshold={inspected.effectThreshold}
                holographic={inspected.holographic}
                signed={inspected.signed}
                basePoints={inspected.basePoints}
              />
              <div className="mx-auto flex w-full max-w-sm flex-col border-y border-[#d4b36a]/30 sm:mx-0">
                <InspectLedgerRow
                  label={tCollection("inspect.rarity")}
                  value={tRarity(inspected.rarity)}
                  valueClassName="text-[#d4b36a]"
                />
                <InspectLedgerRow
                  label={tCollection("inspect.mark")}
                  value={
                    inspected.holographic
                      ? tCollection("inspect.holo")
                      : tCollection("inspect.none")
                  }
                  valueClassName={
                    inspected.holographic
                      ? "text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.3)]"
                      : "text-[#d7d3c8]/50"
                  }
                />
                <InspectLedgerRow
                  label={tCollection("inspect.seal")}
                  value={
                    inspected.signed
                      ? tCollection("inspect.signed")
                      : tCollection("inspect.none")
                  }
                />
                {selected ? (
                  <InspectLedgerRow
                    label={t("inspectLineup")}
                    value={selected.name}
                  />
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                {selected && inspectedInDeck ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={pending}
                    onClick={() => removeCard(inspected.cardId)}
                  >
                    {t("removeFrom", { name: selected.name })}
                  </Button>
                ) : null}
                {selected && !inspectedInDeck && roomLeft ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() => addCard(inspected.cardId)}
                  >
                    {t("addTo", { name: selected.name })}
                  </Button>
                ) : null}
                <button
                  type="button"
                  className="font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.24em] text-[#f3efe6] uppercase hover:text-[#d4b36a]"
                  onClick={() => setInspectId(null)}
                >
                  {tCommon("close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
