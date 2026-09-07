import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { boosterTypes, draws, users } from "@/db/schema";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { SanctumCard, SanctumEmpty, SanctumPager } from "@/components/sanctum";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MutationBadges, RarityBadge } from "@/components/ui/badge";
import { liveCms } from "@/lib/cms/live";
import { PAGE_SIZE } from "@/lib/constants";
import { formatCardNumber, formatDate } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";

function drawsHref(
  params: { user?: string; booster?: string; from?: string; to?: string },
  page: number,
) {
  const query = new URLSearchParams();
  if (params.user) query.set("user", params.user);
  if (params.booster) query.set("booster", params.booster);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (page > 1) query.set("page", String(page));
  const search = query.toString();
  return search ? `/admin/history?${search}` : "/admin/history";
}

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    user?: string;
    booster?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const db = getDb();
  const types = await db.select().from(boosterTypes).where(liveCms(boosterTypes));

  const filters = [];
  if (params.user) {
    filters.push(sql`${draws.viewerName} ilike ${"%" + params.user + "%"}`);
  }
  if (params.booster) filters.push(eq(draws.boosterTypeId, params.booster));
  if (params.from) filters.push(gte(draws.createdAt, new Date(params.from)));
  if (params.to) filters.push(lte(draws.createdAt, new Date(params.to)));

  const where = filters.length ? and(...filters) : undefined;

  const rows = await db
    .select({
      id: draws.id,
      createdAt: draws.createdAt,
      cardName: draws.cardName,
      cardNumber: draws.cardNumber,
      cardRarity: draws.cardRarity,
      holographic: draws.holographic,
      signature: draws.signature,
      isDuplicate: draws.isDuplicate,
      viewerName: draws.viewerName,
      boosterName: boosterTypes.name,
      triggeredByName: users.name,
    })
    .from(draws)
    .leftJoin(boosterTypes, eq(draws.boosterTypeId, boosterTypes.id))
    .leftJoin(users, eq(draws.triggeredBy, users.id))
    .where(where)
    .orderBy(desc(draws.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const hasMore = rows.length === PAGE_SIZE;
  const [t, tCommon, locale] = await Promise.all([
    getTranslations("draws"),
    getTranslations("common"),
    getLocale(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader title={t("title")} eyebrow={t("eyebrow")} />
      <SanctumCard className="mb-6">
        <form className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t("viewer")}</Label>
            <Input name="user" defaultValue={params.user} placeholder={t("nickname")} />
          </div>
          <div>
            <Label>{t("booster")}</Label>
            <Select name="booster" defaultValue={params.booster ?? ""}>
              <option value="">{tCommon("all")}</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>{t("from")}</Label>
            <Input name="from" type="date" defaultValue={params.from} />
          </div>
          <div>
            <Label>{t("to")}</Label>
            <Input name="to" type="date" defaultValue={params.to} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">{tCommon("filter")}</Button>
          </div>
        </form>
      </SanctumCard>
      {rows.length === 0 ? (
        <SanctumEmpty>{t("noMatch")}</SanctumEmpty>
      ) : (
        <SanctumCard className="px-6 py-0">
          <ul>
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-4 border-b border-[#d7d3c8]/15 py-5 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="font-[family-name:var(--font-cormorant)] text-[22px] text-[#f3efe6] italic">
                    {row.viewerName}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.16em] text-[#d7d3c8]/60 uppercase">
                    {formatCardNumber(row.cardNumber)} {row.cardName}
                    {row.isDuplicate ? t("echo") : ""}
                    {` · ${row.boosterName ?? tCommon("manual")}`}
                    {row.triggeredByName ? ` · ${row.triggeredByName}` : ""}
                    {` · ${formatDate(row.createdAt, locale)}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <RarityBadge rarity={row.cardRarity} />
                  <MutationBadges
                    holographic={row.holographic}
                    signature={row.signature}
                  />
                </div>
              </li>
            ))}
          </ul>
        </SanctumCard>
      )}
      <SanctumPager
        prevHref={page > 1 ? drawsHref(params, page - 1) : null}
        nextHref={hasMore ? drawsHref(params, page + 1) : null}
      />
    </main>
  );
}
