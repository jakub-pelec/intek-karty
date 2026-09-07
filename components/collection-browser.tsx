"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
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
import { RARITIES } from "@/lib/constants";
import { RARITY_LIGHT } from "@/lib/open-fx";
import { toRoman } from "@/lib/ritual";
import { cn, formatDate } from "@/lib/utils";

const OWN_KEYS = {
  all: "all",
  owned: "bound",
  missing: "unseen",
} as const;

const VARIANT_KEYS = {
  holo: "holo",
  signed: "signed",
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

function RelicsBound({
  owned,
  total,
  className,
}: {
  owned: number;
  total: number;
  className?: string;
}) {
  const t = useTranslations("collection");
  return (
    <p
      className={cn(
        "font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.3em] text-[#d4b36a] uppercase",
        className,
      )}
    >
      {t("relicsBound", { owned: toRoman(owned), total: toRoman(total) })}
    </p>
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
        "ritual-ember self-center border-b pb-0.5 font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.16em] uppercase md:self-start md:text-[11px] md:tracking-[0.24em]",
        active
          ? "border-[#d4b36a] text-[#d4b36a]"
          : "border-transparent text-[#d7d3c8]/40 hover:border-[#d4b36a]/50",
      )}
    >
      {children}
    </Link>
  );
}

function FilterGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col items-center gap-1.5 md:items-start md:gap-3", className)}>
      <span className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.24em] text-[#d7d3c8]/40 uppercase">
        {label}
      </span>
      <div className="flex flex-row flex-wrap items-center justify-center gap-x-3 gap-y-1.5 md:flex-col md:items-start md:justify-start md:gap-3">
        {children}
      </div>
    </div>
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
  const locale = useLocale();
  const t = useTranslations("collection");
  const tRarity = useTranslations("rarity");
  const tCommon = useTranslations("common");
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
    <>
    <div className="relative grid grid-cols-1 items-start gap-5 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-x-10 md:gap-y-0 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-x-16">
      <div className="relative z-10 min-w-0 text-center md:col-start-2 md:row-start-1 md:mb-1 md:text-left">
        <div className="flex flex-col justify-between md:flex-row md:items-end">
          <h1 className="font-[family-name:var(--font-cormorant)] text-[40px] tracking-wide text-[#cfc6b4] italic md:text-[53px]">
            {t("title")}
          </h1>
          <RelicsBound
            owned={progress.owned}
            total={progress.total}
            className="hidden md:block"
          />
        </div>
      </div>

      <aside className="relative z-10 flex w-full min-w-0 flex-col items-center gap-3 md:col-start-1 md:row-span-2 md:row-start-1 md:items-start md:gap-0 md:pr-8 lg:pr-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-[#d4b36a] to-transparent md:block"
        />
        <h2 className="hidden font-[family-name:var(--font-cormorant)] text-[53px] tracking-wide text-[#cfc6b4] italic md:mb-1 md:block">
          {t("filters")}
        </h2>
        <div className="flex w-full flex-col items-center gap-3 md:items-start md:gap-10">
        {sets.length > 0 ? (
          <FilterGroup label={t("set")}>
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
          </FilterGroup>
        ) : null}
        <FilterGroup label={t("status")} className="hidden md:flex">
          {OWNERSHIP_FILTERS.map((own) => (
            <FilterLink
              key={own}
              href={collectionHref({ ...viewQuery, own })}
              active={viewQuery.own === own}
              onSelect={() => applyFilter((current) => ({ ...current, own }))}
            >
              {t(OWN_KEYS[own])}
            </FilterLink>
          ))}
        </FilterGroup>
        <FilterGroup label={t("rarity")} className="hidden md:flex">
          <FilterLink
            href={collectionHref({ ...viewQuery, rarities: [] })}
            active={viewQuery.rarities.length === 0}
            onSelect={() => applyFilter((current) => ({ ...current, rarities: [] }))}
          >
            {t("anyRarity")}
          </FilterLink>
          {RARITIES.map((rarity) => (
            <FilterLink
              key={rarity}
              href={collectionHref(toggleRarity(viewQuery, rarity))}
              active={viewQuery.rarities.includes(rarity)}
              onSelect={() => applyFilter((current) => toggleRarity(current, rarity))}
            >
              {tRarity(rarity)}
            </FilterLink>
          ))}
        </FilterGroup>
        <FilterGroup label={t("mark")} className="hidden md:flex">
          <FilterLink
            href={collectionHref({ ...viewQuery, variants: [] })}
            active={viewQuery.variants.length === 0}
            onSelect={() => applyFilter((current) => ({ ...current, variants: [] }))}
          >
            {t("anyMark")}
          </FilterLink>
          {VARIANT_FILTERS.map((variant) => (
            <FilterLink
              key={variant}
              href={collectionHref(toggleVariant(viewQuery, variant))}
              active={viewQuery.variants.includes(variant)}
              onSelect={() => applyFilter((current) => toggleVariant(current, variant))}
            >
              {t(VARIANT_KEYS[variant])}
            </FilterLink>
          ))}
        </FilterGroup>
        <FilterGroup label={t("sort")} className="hidden md:flex">
          {COLLECTION_SORTS.map((sort) => (
            <FilterLink
              key={sort}
              href={collectionHref({ ...viewQuery, sort })}
              active={viewQuery.sort === sort}
              onSelect={() => applyFilter((current) => ({ ...current, sort }))}
            >
              {t(sort)}
            </FilterLink>
          ))}
        </FilterGroup>
        </div>
      </aside>

      <div className="relative min-w-0 md:col-start-2 md:row-start-2">
        <RelicsBound
          owned={progress.owned}
          total={progress.total}
          className="mb-1 text-right md:hidden"
        />
        <div className="relative z-10 border border-[#d4b36a]/25 bg-[#05040a]/45 px-4 py-6 sm:px-10 sm:py-12">
          {visible.length === 0 ? (
            <p className="py-16 text-center font-[family-name:var(--font-cormorant)] text-lg text-[#d7d3c8]/50 italic">
              {t("noMatch")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-[64px] lg:grid-cols-3 lg:gap-x-10 lg:gap-y-[80px] xl:grid-cols-4 xl:gap-x-12 xl:gap-y-[88px]">
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
                        {slot.signed ? t("unseenSigned") : t("unseen")}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

      {selected?.owned ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-[#05040a]/80 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative my-auto flex w-full max-w-6xl flex-col items-center gap-5 overflow-y-auto border border-[#d4b36a]/35 bg-[#0c0b12] px-5 py-5 sm:max-h-none sm:flex-row sm:items-center sm:gap-14 sm:overflow-visible sm:px-14 sm:py-14"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label={tCommon("close")}
              className="absolute top-3 right-3 z-20 p-1 text-[#d4b36a] hover:text-[#e8cf8a] sm:top-5 sm:right-5"
              onClick={() => setSelected(null)}
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                background: `radial-gradient(ellipse 56% 92% at 50% 112%, color-mix(in srgb, ${RARITY_LIGHT[selected.owned.rarity]} 32%, transparent) 0%, color-mix(in srgb, ${RARITY_LIGHT[selected.owned.rarity]} 14%, transparent) 42%, transparent 78%)`,
              }}
            />
            <CardInspect
              className="relative z-10 w-[min(16rem,70vw)] shrink-0 sm:w-[28rem] lg:w-[32rem]"
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
            <div className="relative z-10 min-w-0 w-full flex-1 space-y-5 text-center sm:space-y-8 sm:text-left">
              <div className="space-y-3 sm:space-y-4">
                <p className="font-[family-name:var(--font-cinzel)] text-xs tracking-[0.2em] text-[#d7d3c8]/70 uppercase">
                  {toRoman(selected.number)}
                </p>
                <h2 className="font-[family-name:var(--font-cormorant)] text-[40px] leading-none text-[#f3efe6] italic sm:text-[72px]">
                  {selected.owned.name}
                </h2>
              </div>
              <div className="mx-auto flex w-full max-w-sm flex-col border-y border-[#d4b36a]/30 sm:mx-0">
                <InspectLedgerRow
                  label={t("inspect.rarity")}
                  value={tRarity(selected.owned.rarity)}
                  valueClassName="text-[#d4b36a]"
                />
                <InspectLedgerRow
                  label={t("inspect.mark")}
                  value={selected.owned.holographic ? t("inspect.holo") : t("inspect.none")}
                  valueClassName={
                    selected.owned.holographic
                      ? "text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.3)]"
                      : "text-[#d7d3c8]/50"
                  }
                />
                <InspectLedgerRow
                  label={t("inspect.seal")}
                  value={selected.owned.signature ? t("inspect.signed") : t("inspect.none")}
                />
                <InspectLedgerRow
                  label={t("inspect.bound")}
                  value={formatDate(selected.owned.acquiredAt, locale)}
                />
              </div>
              <button
                type="button"
                className="font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.24em] text-[#f3efe6] uppercase hover:text-[#d4b36a]"
                onClick={() => setSelected(null)}
              >
                {tCommon("close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export type { CollectionSlot };
