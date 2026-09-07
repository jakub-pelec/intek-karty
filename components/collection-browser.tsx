"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
      <span className="font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.2em] text-[#d4b36a]/70 uppercase">
        {label}
      </span>
      <span
        className={cn(
          "font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.24em] uppercase",
          valueClassName ?? "text-[#d7d3c8]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function FilterLink({
  active,
  href,
  onSelect,
  children,
}: {
  active: boolean;
  href: string;
  onSelect: () => void;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      prefetch={false}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;
        event.preventDefault();
        onSelect();
      }}
      className={cn(
        "ritual-ember self-start border-b pb-0.5 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.24em] uppercase",
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [selected, setSelected] = useState<CollectionSlot | null>(null);
  const [optimistic, setOptimistic] = useState<CollectionQuery | null>(null);
  const fromUrl = useMemo(() => {
    const parsed = parseCollectionQuery({
      set: searchParams.get("set") ?? undefined,
      own: searchParams.get("own") ?? undefined,
      rarity: searchParams.get("rarity") ?? undefined,
      variant: searchParams.get("variant") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    });
    return { ...parsed, set: parsed.set ?? query.set };
  }, [search, query.set, searchParams]);
  const viewQuery = optimistic ?? fromUrl;
  const viewQueryRef = useRef(viewQuery);
  viewQueryRef.current = viewQuery;

  useEffect(() => {
    setSelected(null);
  }, [query.set]);

  useEffect(() => {
    setOptimistic((current) => {
      if (!current) return null;
      if (
        current.set === fromUrl.set &&
        current.own === fromUrl.own &&
        current.sort === fromUrl.sort &&
        current.rarities.join() === fromUrl.rarities.join() &&
        current.variants.join() === fromUrl.variants.join()
      ) {
        return null;
      }
      return current;
    });
  }, [fromUrl]);

  useEffect(() => {
    function onPop() {
      setOptimistic(null);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const visible = useMemo(
    () => arrangeCollection(slots, viewQuery),
    [slots, viewQuery],
  );
  const priorityIndexes = new Set(
    visible.flatMap((slot, index) => (slot.owned ? [index] : [])).slice(0, 2),
  );

  function applyFilter(build: (prev: CollectionQuery) => CollectionQuery) {
    const next = build(viewQueryRef.current);
    viewQueryRef.current = next;
    setOptimistic(next);
    router.replace(collectionHref(next), { scroll: false });
  }

  return (
    <div className="relative flex flex-col items-start gap-10 lg:flex-row lg:gap-16">
      <aside className="relative z-10 flex w-full shrink-0 flex-col gap-10 md:min-h-[600px] lg:w-56 lg:border-r lg:border-[#d4b36a]/25 lg:pr-10">
        {sets.length > 0 ? (
          <div className="flex flex-col items-start gap-3">
            <span className="mb-1 font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.24em] text-[#d7d3c8]/40 uppercase">
              Set
            </span>
            {sets.map((set) => (
              <FilterLink
                key={set.slug}
                href={collectionHref({ ...viewQuery, set: set.slug })}
                active={viewQuery.set === set.slug}
                onSelect={() => applyFilter((current) => ({ ...current, set: set.slug }))}
              >
                {set.name}
              </FilterLink>
            ))}
          </div>
        ) : null}
        <div className="flex flex-col items-start gap-3">
          <span className="mb-1 font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.24em] text-[#d7d3c8]/40 uppercase">
            Status
          </span>
          {OWNERSHIP_FILTERS.map((own) => (
            <FilterLink
              key={own}
              href={collectionHref({ ...viewQuery, own })}
              active={viewQuery.own === own}
              onSelect={() => applyFilter((current) => ({ ...current, own }))}
            >
              {OWN_LABELS[own]}
            </FilterLink>
          ))}
        </div>
        <div className="flex flex-col items-start gap-3">
          <span className="mb-1 font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.24em] text-[#d7d3c8]/40 uppercase">
            Rarity
          </span>
          <FilterLink
            href={collectionHref({ ...viewQuery, rarities: [] })}
            active={viewQuery.rarities.length === 0}
            onSelect={() => applyFilter((current) => ({ ...current, rarities: [] }))}
          >
            Any rarity
          </FilterLink>
          {RARITIES.map((rarity) => (
            <FilterLink
              key={rarity}
              href={collectionHref(toggleRarity(viewQuery, rarity))}
              active={viewQuery.rarities.includes(rarity)}
              onSelect={() => applyFilter((current) => toggleRarity(current, rarity))}
            >
              {RARITY_LABELS[rarity]}
            </FilterLink>
          ))}
        </div>
        <div className="flex flex-col items-start gap-3">
          <span className="mb-1 font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.24em] text-[#d7d3c8]/40 uppercase">
            Mark
          </span>
          <FilterLink
            href={collectionHref({ ...viewQuery, variants: [] })}
            active={viewQuery.variants.length === 0}
            onSelect={() => applyFilter((current) => ({ ...current, variants: [] }))}
          >
            Any mark
          </FilterLink>
          {VARIANT_FILTERS.map((variant) => (
            <FilterLink
              key={variant}
              href={collectionHref(toggleVariant(viewQuery, variant))}
              active={viewQuery.variants.includes(variant)}
              onSelect={() => applyFilter((current) => toggleVariant(current, variant))}
            >
              {VARIANT_LABELS[variant]}
            </FilterLink>
          ))}
        </div>
        <div className="flex flex-col items-start gap-3">
          <span className="mb-1 font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.24em] text-[#d7d3c8]/40 uppercase">
            Sort
          </span>
          {COLLECTION_SORTS.map((sort) => (
            <FilterLink
              key={sort}
              href={collectionHref({ ...viewQuery, sort })}
              active={viewQuery.sort === sort}
              onSelect={() => applyFilter((current) => ({ ...current, sort }))}
            >
              {SORT_LABELS[sort]}
            </FilterLink>
          ))}
        </div>
      </aside>

      <div className="relative min-w-0 flex-1">
        <div className="collection-vault-well pointer-events-none absolute -inset-10 z-0" />
        <div className="relative z-10 mb-8 flex flex-col justify-between md:flex-row md:items-end">
          <div>
            <h1 className="font-[family-name:var(--font-cormorant)] text-[40px] leading-none tracking-wide text-[#cfc6b4] italic md:text-[53px]">
              Collection
            </h1>
            <p className="mt-3 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.3em] text-[#d4b36a]/70 uppercase">
              {toRoman(progress.owned)} of {toRoman(progress.total)} relics bound
            </p>
          </div>
          <p
            className={cn(
              "mt-4 font-[family-name:var(--font-cinzel)] text-[16px] tracking-[0.16em] uppercase tabular-nums md:mt-0",
              progress.total > 0 && progress.owned >= progress.total
                ? "text-[#7dbe72]"
                : "text-[#d4b36a]",
            )}
          >
            Completed {progress.owned}/{progress.total}
          </p>
        </div>

        <div className="relative z-10 border border-[#d4b36a]/25 bg-[#05040a]/45 px-5 py-8 sm:px-10 sm:py-12">
          {visible.length === 0 ? (
            <p className="py-16 text-center font-[family-name:var(--font-cormorant)] text-lg text-[#d7d3c8]/50 italic">
              No relics match.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-[64px] md:grid-cols-3 md:gap-x-10 md:gap-y-[80px] xl:grid-cols-4 xl:gap-x-12 xl:gap-y-[88px]">
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
                      <p className="truncate font-[family-name:var(--font-cormorant)] text-lg text-[#d7d3c8] italic">
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
      </div>

      {selected?.owned ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#05040a]/80 p-3 sm:items-center sm:p-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative flex w-full max-w-6xl flex-col items-center gap-8 overflow-hidden border border-[#d4b36a]/35 bg-[#0c0b12] px-5 py-6 sm:flex-row sm:items-center sm:gap-14 sm:px-14 sm:py-14"
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
              className="relative z-10 w-80 shrink-0 sm:w-[28rem] lg:w-[32rem]"
              name={selected.owned.name}
              number={selected.number}
              imageUrl={selected.owned.imageUrl}
              holoMapUrl={selected.owned.holoMapUrl}
              backImageUrl={backImageUrl}
              rarity={selected.owned.rarity}
              holographic={selected.owned.holographic}
              signature={selected.owned.signature}
              glow={false}
            />
            <div className="relative z-10 min-w-0 w-full flex-1 space-y-8 text-center sm:text-left">
              <div className="space-y-4">
                <p className="font-[family-name:var(--font-cinzel)] text-xs tracking-[0.2em] text-[#d7d3c8]/70 uppercase">
                  {toRoman(selected.number)}
                </p>
                <h2 className="font-[family-name:var(--font-cormorant)] text-[48px] leading-none text-[#f3efe6] italic sm:text-[72px]">
                  {selected.owned.name}
                </h2>
              </div>
              <div className="mx-auto flex w-full max-w-sm flex-col border-y border-[#d4b36a]/30 sm:mx-0">
                <InspectLedgerRow
                  label="Rarity"
                  value={RARITY_LABELS[selected.owned.rarity]}
                  valueClassName="text-[#d4b36a]"
                />
                <InspectLedgerRow
                  label="Mark"
                  value={selected.owned.holographic ? "Holo" : "—"}
                  valueClassName={
                    selected.owned.holographic
                      ? "text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.3)]"
                      : "text-[#d7d3c8]/50"
                  }
                />
                <InspectLedgerRow
                  label="Seal"
                  value={selected.owned.signature ? "Signed" : "—"}
                />
                <InspectLedgerRow
                  label="Bound"
                  value={formatDate(selected.owned.acquiredAt)}
                />
              </div>
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
