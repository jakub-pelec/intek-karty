"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CardFace } from "@/components/card-face";
import { CardInspect } from "@/components/card-inspect";
import { RelicFrame } from "@/components/relic-frame";
import {
  COLLECTION_SORTS,
  OWNERSHIP_FILTERS,
  VARIANT_FILTERS,
  arrangeCollection,
  collectionHref,
  parseCollectionQuery,
  toggleRarity,
  toggleVariant,
  type CollectionQuery,
  type CollectionSlot,
} from "@/lib/collection";
import { RARITIES, RARITY_LABELS } from "@/lib/constants";
import { RARITY_LIGHT } from "@/lib/open-fx";
import { toRoman } from "@/lib/ritual";
import { cn, formatDate } from "@/lib/utils";

const OWN_LABELS: Record<(typeof OWNERSHIP_FILTERS)[number], string> = {
  all: "All",
  owned: "Bound",
  missing: "Unseen",
};

const VARIANT_LABELS: Record<(typeof VARIANT_FILTERS)[number], string> = {
  holo: "Holo",
  signed: "Signed",
};

const SORT_LABELS: Record<(typeof COLLECTION_SORTS)[number], string> = {
  number: "Number",
  rarity: "Rarity",
  name: "Name",
  newest: "Newest",
};

function FilterLink({
  active,
  href,
  instant,
  onInstant,
  children,
}: {
  active: boolean;
  href: string;
  instant?: boolean;
  onInstant?: () => void;
  children: string;
}) {
  const router = useRouter();
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      prefetch={false}
      onMouseEnter={() => {
        if (!instant) router.prefetch(href);
      }}
      onFocus={() => {
        if (!instant) router.prefetch(href);
      }}
      onClick={(event) => {
        if (!instant || !onInstant) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;
        event.preventDefault();
        onInstant();
      }}
      className={cn(
        "ritual-ember border-b pb-0.5 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.24em] uppercase",
        active
          ? "border-[#d4b36a] text-[#d4b36a]"
          : "border-transparent text-[#d7d3c8]/40 hover:border-[#d4b36a]/50",
      )}
    >
      {children}
    </Link>
  );
}

export function CollectionBrowser({
  slots,
  query,
  sets,
  progress,
  backImageUrl,
}: {
  slots: CollectionSlot[];
  query: CollectionQuery;
  sets: { slug: string; name: string }[];
  progress: { owned: number; total: number };
  backImageUrl?: string | null;
}) {
  const [selected, setSelected] = useState<CollectionSlot | null>(null);
  const [viewQuery, setViewQuery] = useState(() => {
    if (typeof window === "undefined") return query;
    const params = new URLSearchParams(window.location.search);
    const parsed = parseCollectionQuery({
      set: params.get("set") ?? undefined,
      own: params.get("own") ?? undefined,
      rarity: params.get("rarity") ?? undefined,
      variant: params.get("variant") ?? undefined,
      sort: params.get("sort") ?? undefined,
    });
    return { ...parsed, set: parsed.set ?? query.set };
  });
  const visible = useMemo(
    () => arrangeCollection(slots, viewQuery),
    [slots, viewQuery],
  );
  const priorityIndexes = new Set(
    visible.flatMap((slot, index) => (slot.owned ? [index] : [])).slice(0, 2),
  );

  function applyFilter(next: CollectionQuery) {
    setViewQuery(next);
    window.history.replaceState(null, "", collectionHref(next));
  }

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-4">
        {sets.length > 0 ? (
          <div className="mb-2 flex flex-wrap items-center justify-center gap-x-10 gap-y-2">
            {sets.map((set) => (
              <FilterLink
                key={set.slug}
                href={collectionHref({ ...viewQuery, set: set.slug })}
                active={viewQuery.set === set.slug}
              >
                {set.name}
              </FilterLink>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {OWNERSHIP_FILTERS.map((own) => (
            <FilterLink
              key={own}
              href={collectionHref({ ...viewQuery, own })}
              active={viewQuery.own === own}
              instant
              onInstant={() => applyFilter({ ...viewQuery, own })}
            >
              {OWN_LABELS[own]}
            </FilterLink>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <FilterLink
            href={collectionHref({ ...viewQuery, rarities: [] })}
            active={viewQuery.rarities.length === 0}
            instant
            onInstant={() => applyFilter({ ...viewQuery, rarities: [] })}
          >
            Any rarity
          </FilterLink>
          {RARITIES.map((rarity) => (
            <FilterLink
              key={rarity}
              href={collectionHref(toggleRarity(viewQuery, rarity))}
              active={viewQuery.rarities.includes(rarity)}
              instant
              onInstant={() => applyFilter(toggleRarity(viewQuery, rarity))}
            >
              {RARITY_LABELS[rarity]}
            </FilterLink>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <FilterLink
            href={collectionHref({ ...viewQuery, variants: [] })}
            active={viewQuery.variants.length === 0}
            instant
            onInstant={() => applyFilter({ ...viewQuery, variants: [] })}
          >
            Any mark
          </FilterLink>
          {VARIANT_FILTERS.map((variant) => (
            <FilterLink
              key={variant}
              href={collectionHref(toggleVariant(viewQuery, variant))}
              active={viewQuery.variants.includes(variant)}
              instant
              onInstant={() => applyFilter(toggleVariant(viewQuery, variant))}
            >
              {VARIANT_LABELS[variant]}
            </FilterLink>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {COLLECTION_SORTS.map((sort) => (
            <FilterLink
              key={sort}
              href={collectionHref({ ...viewQuery, sort })}
              active={viewQuery.sort === sort}
              instant
              onInstant={() => applyFilter({ ...viewQuery, sort })}
            >
              {SORT_LABELS[sort]}
            </FilterLink>
          ))}
        </div>
      </div>

      <div className="border border-[#d4b36a]/25 bg-[#05040a]/45 px-5 py-6 sm:px-8 sm:py-8">
      <p
        className={cn(
          "mb-6 text-right font-[family-name:var(--font-cinzel)] text-[16px] tracking-[0.16em] uppercase tabular-nums",
          progress.total > 0 && progress.owned >= progress.total
            ? "text-[#7dbe72]"
            : "text-[#d4b36a]",
        )}
      >
        Completed {progress.owned}/{progress.total}
      </p>
      {visible.length === 0 ? (
        <p className="py-16 text-center font-[family-name:var(--font-cormorant)] text-lg text-[#d7d3c8]/50 italic">
          No relics match.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-12 gap-y-[77px] sm:grid-cols-3 md:grid-cols-4">
          {visible.map((slot, index) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => slot.owned && setSelected(slot)}
              className={cn("text-left", slot.owned ? "cursor-pointer" : "cursor-default")}
            >
              <div className={slot.owned ? "collection-bound-card" : undefined}>
                <RelicFrame
                  rarity={slot.owned?.rarity}
                  holographic={slot.owned?.holographic}
                  sealed={!slot.owned}
                >
                  {slot.owned ? (
                    <CardFace
                      name={slot.owned.name}
                      imageUrl={slot.owned.imageUrl}
                      rarity={slot.owned.rarity}
                      holographic={slot.owned.holographic}
                      priority={priorityIndexes.has(index)}
                    />
                  ) : (
                    <>
                      {backImageUrl ? (
                        <CardFace
                          name={`${slot.name} back`}
                          imageUrl={backImageUrl}
                          className="opacity-28"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#05040a]" />
                      )}
                      <div className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center bg-[#05040a]/55">
                        <span
                          className="font-[family-name:var(--font-cormorant)] text-[80px] font-semibold text-[#e8edf2] italic"
                          style={{
                            textShadow:
                              "0 0 8px rgba(232,237,242,0.95), 0 0 22px rgba(184,192,200,0.75), 0 0 42px rgba(184,192,200,0.45)",
                          }}
                        >
                          ?
                        </span>
                      </div>
                    </>
                  )}
                  <p className="absolute top-3 z-20 w-full text-center font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.18em] text-[#d7d3c8]/40 uppercase">
                    {toRoman(slot.number)}
                  </p>
                </RelicFrame>
              </div>
              <div className="mt-3 text-center">
                {slot.owned ? (
                  <p className="truncate font-[family-name:var(--font-cormorant)] text-sm text-[#d7d3c8] italic">
                    {slot.owned.name}
                  </p>
                ) : (
                  <p className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.18em] text-[#8a8578] uppercase">
                    {slot.signed ? "Unseen signed" : "Unseen"}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      </div>

      {selected?.owned ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#05040a]/80 p-4 sm:items-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative flex w-full max-w-3xl flex-col items-center gap-8 overflow-hidden border border-[#d4b36a]/35 bg-[#0c0b12] px-6 py-6 sm:flex-row sm:items-center sm:gap-10 sm:px-10 sm:py-9"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                background: `radial-gradient(ellipse 56% 92% at 50% 112%, color-mix(in srgb, ${RARITY_LIGHT[selected.owned.rarity]} 32%, transparent) 0%, color-mix(in srgb, ${RARITY_LIGHT[selected.owned.rarity]} 14%, transparent) 42%, transparent 78%)`,
              }}
            />
            <CardInspect
              className="relative z-10 w-56 shrink-0 sm:w-72"
              name={selected.owned.name}
              imageUrl={selected.owned.imageUrl}
              backImageUrl={backImageUrl}
              rarity={selected.owned.rarity}
              holographic={selected.owned.holographic}
              signature={selected.owned.signature}
              glow={false}
            />
            <div className="relative z-10 min-w-0 flex-1 space-y-4 text-center sm:text-left">
              <p className="font-[family-name:var(--font-cinzel)] text-xs tracking-[0.2em] text-[#d7d3c8]/70 uppercase">
                {toRoman(selected.number)}
              </p>
              <h2 className="font-[family-name:var(--font-cormorant)] text-[40px] text-[#f3efe6] italic sm:text-[53px]">
                {selected.owned.name}
              </h2>
              <p className="font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.24em] text-[#d4b36a] uppercase">
                {selected.owned.rarity}
                {selected.owned.holographic ? " · holo" : ""}
                {selected.owned.signature ? " · signed" : ""}
              </p>
              <div className="h-px bg-[#d4b36a]/40" />
              <p className="text-lg leading-relaxed text-[#d7d3c8]">
                {selected.owned.description}
              </p>
              <p className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.16em] text-[#d7d3c8]/75 uppercase">
                Bound {formatDate(selected.owned.acquiredAt)}
              </p>
              <button
                type="button"
                className="font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.24em] text-[#f3efe6] uppercase hover:text-[#d4b36a]"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export type { CollectionSlot };
