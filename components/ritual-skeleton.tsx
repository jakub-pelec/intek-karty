"use client";

import { RelicFrame } from "@/components/relic-frame";
import { CardBloom } from "@/components/rarity-glow";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { SkeletonRoot } from "@/components/ritual-skeleton-root";
import { SanctumCard } from "@/components/sanctum";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

function TypeBone({
  className,
  children,
}: {
  className?: string;
  children: string;
}) {
  return (
    <span className={cn("ritual-shimmer rounded-sm text-transparent", className)}>
      {children}
    </span>
  );
}

function PageHeaderSkeleton({
  title,
  eyebrow,
}: {
  title: string;
  eyebrow: string;
}) {
  return (
    <RitualPageHeader title={title}>
      <p className="mt-3 font-[family-name:var(--font-cinzel)] text-[14px] tracking-[0.3em] uppercase">
        <TypeBone>{eyebrow}</TypeBone>
      </p>
    </RitualPageHeader>
  );
}

function FieldBone({ label }: { label: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="h-10 border border-[#d4b36a]/30 bg-[#05040a]" />
    </div>
  );
}

function AdminListRow({
  name,
  meta,
  action,
  badges = false,
}: {
  name: string;
  meta: string;
  action?: string;
  badges?: boolean;
}) {
  const tRarity = useTranslations("rarity");
  return (
    <li className="flex items-center justify-between gap-4 border-b border-[#d7d3c8]/15 py-5 last:border-b-0">
      <div className="min-w-0">
        <p className="font-[family-name:var(--font-cormorant)] text-[24px] italic">
          <TypeBone>{name}</TypeBone>
        </p>
        <p className="mt-1 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.16em] uppercase">
          <TypeBone>{meta}</TypeBone>
        </p>
      </div>
      {action ? (
        <span className={cn(buttonVariants(), "pointer-events-none shrink-0")}>
          <span className="invisible">{action}</span>
        </span>
      ) : null}
      {badges ? (
        <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.16em] uppercase">
          <TypeBone>{tRarity("legendary")}</TypeBone>
        </span>
      ) : null}
    </li>
  );
}

function AdminListCard({
  rows,
  action,
  badges,
}: {
  rows: { name: string; meta: string }[];
  action?: string;
  badges?: boolean;
}) {
  return (
    <SanctumCard className="px-6 py-0">
      <ul>
        {rows.map((row) => (
          <AdminListRow
            key={`${row.name}-${row.meta}`}
            name={row.name}
            meta={row.meta}
            action={action}
            badges={badges}
          />
        ))}
      </ul>
    </SanctumCard>
  );
}

const ADMIN_ROWS = [
  { name: "Twitch Viewer", meta: "Origin Pack · 6 Sep 2026" },
  { name: "Channel Guest", meta: "Night Vault · 6 Sep 2026" },
  { name: "Stream Warden", meta: "Origin Pack · 5 Sep 2026" },
  { name: "Altar Keeper", meta: "Night Vault · 4 Sep 2026" },
];

export function AdminQueueSkeleton() {
  const t = useTranslations("queue");
  return (
    <SkeletonRoot className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <PageHeaderSkeleton title={t("title")} eyebrow={t("waiting", { count: 4 })} />
      <AdminListCard rows={ADMIN_ROWS} action={t("open")} />
    </SkeletonRoot>
  );
}

export function AdminFulfillmentSkeleton() {
  const t = useTranslations("fulfillment");
  return (
    <SkeletonRoot className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <PageHeaderSkeleton title={t("title")} eyebrow={t("eyebrow")} />
      <AdminListCard
        rows={[
          { name: "Twitch Viewer", meta: "Signed print · 40 echoes · pending · 6 Sep 2026" },
          { name: "Channel Guest", meta: "Emote pack · 20 echoes · pending · 5 Sep 2026" },
          { name: "Stream Warden", meta: "Signed print · 40 echoes · pending · 4 Sep 2026" },
        ]}
        action={t("fulfill")}
      />
    </SkeletonRoot>
  );
}

export function AdminUsersSkeleton() {
  const t = useTranslations("users");
  return (
    <SkeletonRoot className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <PageHeaderSkeleton title={t("title")} eyebrow={t("inLedger", { total: 24 })} />
      <SanctumCard className="mb-6">
        <div className="h-10 border border-[#d4b36a]/30 bg-[#05040a]" />
      </SanctumCard>
      <AdminListCard
        rows={[
          { name: "Altar Keeper", meta: "viewer · 12 echoes" },
          { name: "Channel Guest", meta: "viewer · 8 echoes" },
          { name: "Stream Warden", meta: "admin · 40 echoes" },
          { name: "Twitch Viewer", meta: "viewer · 0 echoes" },
        ]}
      />
    </SkeletonRoot>
  );
}

export function AdminDrawsSkeleton() {
  const t = useTranslations("draws");
  const tCommon = useTranslations("common");
  return (
    <SkeletonRoot className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <PageHeaderSkeleton title={t("title")} eyebrow={t("eyebrow")} />
      <SanctumCard className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldBone label={t("viewer")} />
          <FieldBone label={t("booster")} />
          <FieldBone label={t("from")} />
          <FieldBone label={t("to")} />
          <div className="sm:col-span-2">
            <span className={cn(buttonVariants(), "pointer-events-none")}>
              <span className="invisible">{tCommon("filter")}</span>
            </span>
          </div>
        </div>
      </SanctumCard>
      <AdminListCard
        rows={[
          { name: "Twitch Viewer", meta: "01 Relic · Origin Pack · 6 Sep 2026" },
          { name: "Channel Guest", meta: "07 Echo · Night Vault · 6 Sep 2026" },
          { name: "Stream Warden", meta: "12 Sigil · Origin Pack · 5 Sep 2026" },
          { name: "Altar Keeper", meta: "03 Charm · Manual · 4 Sep 2026" },
        ]}
        badges
      />
    </SkeletonRoot>
  );
}

export function AdminDevSkeleton() {
  const t = useTranslations("dev");
  return (
    <SkeletonRoot className="mx-auto w-full max-w-5xl pt-2 md:pt-6">
      <PageHeaderSkeleton title={t("title")} eyebrow={t("eyebrow")} />
      <section className="relative mb-16">
        <h2 className="mb-6 pt-4 text-center font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.3em] text-[#d4b36a]/80 uppercase">
          {t("openingRehearsal")}
        </h2>
        <div className="mx-auto aspect-[2/3] w-full max-w-xl border border-[#d4b36a]/30 bg-[#0c0b12]">
          <div className="ritual-shimmer h-full w-full" />
        </div>
      </section>
    </SkeletonRoot>
  );
}

export function ListPageSkeleton({
  title,
  eyebrow,
  tabs = false,
  cards = false,
  kind,
}: {
  title?: string;
  eyebrow?: string;
  tabs?: boolean;
  cards?: boolean;
  kind?: "titles";
}) {
  const t = useTranslations();
  const fallbackEyebrow = eyebrow ?? t("titles.eyebrow", { completed: "III", total: "XII" });
  return (
    <SkeletonRoot className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      {title ? (
        <PageHeaderSkeleton title={title} eyebrow={fallbackEyebrow} />
      ) : (
        <header className="mb-12 text-center">
          <h1 className="font-[family-name:var(--font-cormorant)] text-[42px] tracking-wide italic md:text-[55px]">
            <TypeBone>{t("common.loading")}</TypeBone>
          </h1>
          <p className="mt-3 font-[family-name:var(--font-cinzel)] text-[14px] tracking-[0.3em] uppercase">
            <TypeBone>{fallbackEyebrow}</TypeBone>
          </p>
        </header>
      )}
      {tabs ? (
        <div className="mb-8 flex justify-center gap-10">
          <span className="border-b border-transparent pb-0.5 font-[family-name:var(--font-cinzel)] text-[14px] tracking-[0.24em] uppercase">
            <TypeBone>{t("chronicle.manifestations")}</TypeBone>
          </span>
          <span className="border-b border-transparent pb-0.5 font-[family-name:var(--font-cinzel)] text-[14px] tracking-[0.24em] uppercase">
            <TypeBone>{t("chronicle.echoes")}</TypeBone>
          </span>
        </div>
      ) : null}
      {cards ? (
        <ul className="space-y-5">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index} className="border border-[#d4b36a]/30 bg-[#0c0b12] px-6 py-5">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] italic">
                  <TypeBone>{t("skeleton.signedPrint")}</TypeBone>
                </h2>
                <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.16em] uppercase">
                  <TypeBone>{t("offerings.echoes", { count: 40 })}</TypeBone>
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed">
                <TypeBone>{t("skeleton.offeringBlurb")}</TypeBone>
              </p>
              <p className="mt-2 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.16em] uppercase">
                <TypeBone>{t("offerings.remaining", { count: 3 })}</TypeBone>
              </p>
              <p className="mt-4 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.24em] uppercase">
                <TypeBone>{t("skeleton.redeem")}</TypeBone>
              </p>
            </li>
          ))}
        </ul>
      ) : tabs ? (
        <ul className="border border-[#d4b36a]/30 bg-[#0c0b12] px-6">
          {Array.from({ length: 6 }, (_, index) => (
            <li
              key={index}
              className="flex items-center justify-between gap-3 border-b border-[#d7d3c8]/15 py-4 last:border-b-0"
            >
              <span className="text-lg italic">
                <TypeBone>{`01 ${t("skeleton.relicName")}`}</TypeBone>
              </span>
              <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-xs tracking-[0.12em] uppercase">
                <TypeBone>6 Sep 2026</TypeBone>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <>
        {kind === "titles" ? (
          <div className="mb-8 flex justify-center">
            <span className={cn(buttonVariants(), "pointer-events-none")}>
              <TypeBone>{t("skeleton.hideBestowed")}</TypeBone>
            </span>
          </div>
        ) : null}
        <ul className="overflow-hidden border border-[#d4b36a]/30 bg-[#0c0b12]">
          {Array.from({ length: 5 }, (_, index) => (
            <li key={index} className="border-b border-[#d7d3c8]/15 px-6 py-5 last:border-b-0">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] italic">
                  <TypeBone>{t("skeleton.firstOffering")}</TypeBone>
                </h2>
                <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-[14px] tracking-[0.2em] uppercase">
                  <TypeBone>{t("titles.bestowed")}</TypeBone>
                </span>
              </div>
              <p className="mt-2 text-lg leading-relaxed">
                <TypeBone>{t("skeleton.titleDescription")}</TypeBone>
              </p>
              <p className="mt-3 font-[family-name:var(--font-cinzel)] text-xs tracking-[0.12em] uppercase">
                <TypeBone>6 Sep 2026 · 10 echoes</TypeBone>
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-[6px] min-w-0 flex-1 bg-[#d4b36a]/15">
                  <div className="ritual-shimmer h-full w-2/5 bg-[#d4b36a]/40" />
                </div>
                <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-xs tracking-[0.12em]">
                  <TypeBone>3/10</TypeBone>
                </span>
              </div>
            </li>
          ))}
        </ul>
        </>
      )}
    </SkeletonRoot>
  );
}

export function CollectionPageSkeleton() {
  const t = useTranslations("collection");
  const tRarity = useTranslations("rarity");
  const tSkeleton = useTranslations("skeleton");
  const filters = [
    [t("set"), ["Origin", "Expansion"]],
    [t("status"), [t("all"), t("bound"), t("unseen")]],
    [t("rarity"), [t("anyRarity"), tRarity("common"), tRarity("rare")]],
    [t("mark"), [t("anyMark"), t("holo"), t("signed")]],
    [t("sort"), [t("number"), t("rarity"), t("name")]],
  ] as const;
  return (
    <SkeletonRoot className="mx-auto w-full max-w-[104rem] px-4 pt-2 pb-16 md:px-8 md:pt-6">
      <div className="relative flex flex-col items-start gap-10 lg:flex-row lg:gap-16">
        <aside className="flex w-full shrink-0 flex-col gap-10 lg:w-56 lg:border-r lg:border-[#d4b36a]/25 lg:pr-10">
          {filters.map(([label, items]) => (
            <div key={label} className="flex flex-col items-start gap-3">
              <span className="mb-1 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.24em] uppercase">
                <TypeBone>{label}</TypeBone>
              </span>
              {items.map((item) => (
                <span
                  key={item}
                  className="border-b border-transparent pb-0.5 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.24em] uppercase"
                >
                  <TypeBone>{item}</TypeBone>
                </span>
              ))}
            </div>
          ))}
        </aside>
        <div className="relative min-w-0 flex-1">
          <div className="mb-8 flex flex-col justify-between md:flex-row md:items-end">
            <div>
              <h1 className="font-[family-name:var(--font-cormorant)] text-[42px] leading-none tracking-wide text-[#cfc6b4] italic md:text-[55px]">
                {t("title")}
              </h1>
              <p className="mt-3 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.3em] uppercase">
                <TypeBone>{tSkeleton("relicsBound")}</TypeBone>
              </p>
            </div>
          </div>
          <div className="border border-[#d4b36a]/25 bg-[#05040a]/45 px-5 py-8 sm:px-10 sm:py-12">
            <div className="grid grid-cols-2 gap-x-6 gap-y-[64px] md:grid-cols-3 md:gap-x-10 md:gap-y-[80px] xl:grid-cols-4 xl:gap-x-12 xl:gap-y-[88px]">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index}>
                  <RelicFrame sealed>
                    <div className="absolute inset-0">
                      <div className="ritual-shimmer h-full w-full" />
                    </div>
                  </RelicFrame>
                  <p className="mt-3 text-center font-[family-name:var(--font-cormorant)] text-lg italic">
                    <TypeBone>{tSkeleton("relicName")}</TypeBone>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SkeletonRoot>
  );
}

export function AltarPageSkeleton() {
  const t = useTranslations("altar");
  const tRarity = useTranslations("rarity");
  const tSkeleton = useTranslations("skeleton");
  return (
    <SkeletonRoot className="flex flex-col items-center px-4 pt-2 pb-16 md:px-8 md:pt-8">
      <h1 className="mb-10 text-center font-[family-name:var(--font-cinzel)] text-[14px] font-medium tracking-[0.4em] uppercase md:mb-12">
        <TypeBone>{tSkeleton("welcome")}</TypeBone>
      </h1>
      <div className="relative mb-12 flex w-full max-w-7xl flex-col lg:mb-16 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,380px)_minmax(0,1fr)] lg:gap-10 xl:gap-12">
        <section className="order-2 flex flex-col pt-10 lg:order-1 lg:pt-12">
          <p className="mb-6 text-center font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.3em] text-[#d4b36a]/60 uppercase lg:mb-8">
            {t("recentManifestations")}
          </p>
          <ul className="space-y-1">
            {Array.from({ length: 4 }, (_, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-3 border-b border-white/5 px-3 py-2 first:border-t"
              >
                <span className="text-[20px] italic">
                  <TypeBone>{`01 ${tSkeleton("relicName")}`}</TypeBone>
                </span>
                <span className="font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.1em] uppercase">
                  <TypeBone>{tRarity("rare")}</TypeBone>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="relative order-1 mb-8 flex flex-col items-center lg:order-2 lg:mb-0">
          <p className="mb-6 font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.3em] text-[#d4b36a]/60 uppercase lg:mb-8">
            {t("latestVision")}
          </p>
          <div className="relative w-full max-w-[380px]">
            <CardBloom color="#d4b36a" />
            <RelicFrame sealed className="relative z-10 w-full">
              <div className="absolute inset-0">
                <div className="ritual-shimmer h-full w-full" />
              </div>
            </RelicFrame>
          </div>
          <p className="mt-8 font-[family-name:var(--font-cinzel)] text-[14px] tracking-[0.25em] uppercase">
            <TypeBone>XII / XX</TypeBone>
          </p>
          <h2 className="mt-3 text-center font-[family-name:var(--font-cormorant)] text-[38px] tracking-wider italic md:text-[48px]">
            <TypeBone>{tSkeleton("relicName")}</TypeBone>
          </h2>
          <span className="mt-3 font-[family-name:var(--font-cinzel)] text-[13px] font-semibold tracking-[0.3em] uppercase">
            <TypeBone>{`${tRarity("legendary")}${t("holoSuffix")}`}</TypeBone>
          </span>
          <span className="mt-1 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.1em] uppercase">
            <TypeBone>6 Sep 2026</TypeBone>
          </span>
        </section>
        <section className="order-3 flex flex-col pt-10 lg:pt-12">
          <p className="mb-6 text-center font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.3em] text-[#d4b36a]/60 uppercase lg:mb-8">
            {t("titlesBestowed")}
          </p>
          <ul className="space-y-1">
            {Array.from({ length: 4 }, (_, index) => (
              <li
                key={index}
                className="flex flex-col items-center justify-center gap-1 border-b border-white/5 px-3 py-4 first:border-t"
              >
                <span className="font-[family-name:var(--font-cinzel)] text-[15px] tracking-widest uppercase">
                  <TypeBone>First Witness</TypeBone>
                </span>
                <span className="font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.2em] uppercase">
                  <TypeBone>6 Sep 2026</TypeBone>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="relic-plinth mx-auto grid w-full max-w-6xl grid-cols-3 gap-3 px-3 pt-8 pb-4 md:gap-8 md:px-8 md:pt-10 md:pb-6">
        {[
          ["12 / 37", tSkeleton("relicsFound")],
          ["40", tSkeleton("echoesGathered")],
          ["3", tSkeleton("titlesBestowed")],
        ].map(([value, label]) => (
          <div key={label} className="flex min-w-0 flex-col items-center text-center">
            <span className="font-[family-name:var(--font-cinzel)] text-[24px] md:text-[28px]">
              <TypeBone>{value}</TypeBone>
            </span>
            <span className="mt-2 font-[family-name:var(--font-cinzel)] text-[11px] leading-[16px] tracking-[0.12em] uppercase md:mt-3 md:text-[12px]">
              <TypeBone>{label}</TypeBone>
            </span>
          </div>
        ))}
      </div>
    </SkeletonRoot>
  );
}

