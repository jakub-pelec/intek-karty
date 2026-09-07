import { and, asc, desc, eq } from "drizzle-orm";
import { isLiveCmsRow, liveCms } from "@/lib/cms/live";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import {
  achievements,
  boosterTypes,
  cards,
  collections,
  draws,
  pointsLedger,
  userAchievements,
  userCards,
  users,
} from "@/db/schema";
import {
  addBoosterAction,
  adjustPointsAction,
  grantCardAction,
  revokeCardAction,
} from "@/actions/admin";
import { ActionForm } from "@/components/action-form";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { SanctumCard, SanctumEmpty, SanctumSection } from "@/components/sanctum";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { MutationBadges, RarityBadge } from "@/components/ui/badge";
import { formatCardNumber, formatDate } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) notFound();

  const [owned, catalog, boosters, userDraws, ledger, unlocked] = await Promise.all([
    db
      .select({
        card: cards,
        acquiredAt: userCards.acquiredAt,
        holographic: userCards.holographic,
        signature: cards.signed,
      })
      .from(userCards)
      .innerJoin(cards, eq(userCards.cardId, cards.id))
      .where(eq(userCards.userId, user.id)),
    db
      .select({
        id: cards.id,
        number: cards.number,
        name: cards.name,
        signed: cards.signed,
        collectionName: collections.name,
      })
      .from(cards)
      .innerJoin(collections, eq(cards.collectionId, collections.id))
      .where(and(liveCms(cards), liveCms(collections)))
      .orderBy(
        asc(collections.sortOrder),
        asc(collections.name),
        cards.number,
        cards.signed,
      ),
    db
      .select({
        id: boosterTypes.id,
        name: boosterTypes.name,
        collectionName: collections.name,
      })
      .from(boosterTypes)
      .innerJoin(collections, eq(boosterTypes.collectionId, collections.id))
      .where(and(liveCms(boosterTypes), liveCms(collections)))
      .orderBy(asc(collections.sortOrder), asc(boosterTypes.name)),
    db
      .select()
      .from(draws)
      .where(eq(draws.userId, user.id))
      .orderBy(desc(draws.createdAt))
      .limit(20),
    db
      .select()
      .from(pointsLedger)
      .where(eq(pointsLedger.userId, user.id))
      .orderBy(desc(pointsLedger.createdAt))
      .limit(20),
    db
      .select({ name: achievements.name, unlockedAt: userAchievements.unlockedAt })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, user.id)),
  ]);

  const liveOwned = owned.filter((row) => isLiveCmsRow(row.card));
  const ownedIds = new Set(liveOwned.map((row) => row.card.id));
  const [t, tRoles, tLedger, tCommon, locale] = await Promise.all([
    getTranslations("userDetail"),
    getTranslations("roles"),
    getTranslations("ledger"),
    getTranslations("common"),
    getLocale(),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl pt-2 md:pt-6">
      <RitualPageHeader
        title={user.name}
        eyebrow={t("eyebrow", {
          twitchId: user.twitchId,
          role: tRoles(user.role),
          points: user.pointsBalance,
        })}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <SanctumCard>
          <ActionForm action={grantCardAction}>
            <input type="hidden" name="userId" value={user.id} />
            <Label>{t("grantCard")}</Label>
            <Select name="cardId" required>
              {groupByCollection(
                catalog.filter((card) => !ownedIds.has(card.id)),
              ).map((group) => (
                <optgroup key={group.name} label={group.name}>
                  {group.items.map((card) => (
                    <option key={card.id} value={card.id}>
                      {formatCardNumber(card.number)} {card.name}
                      {card.signed ? t("signedSuffix") : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
            <Textarea name="reason" required placeholder={t("reasonPlaceholder")} />
            <Button type="submit">{t("grant")}</Button>
          </ActionForm>
        </SanctumCard>

        <SanctumCard>
          <ActionForm action={revokeCardAction}>
            <input type="hidden" name="userId" value={user.id} />
            <Label>{t("revokeCard")}</Label>
            <Select name="cardId" required>
              {liveOwned.map((row) => (
                <option key={row.card.id} value={row.card.id}>
                  {formatCardNumber(row.card.number)} {row.card.name}
                </option>
              ))}
            </Select>
            <Textarea name="reason" required placeholder={t("reasonPlaceholder")} />
            <Button type="submit" variant="danger">
              {t("revoke")}
            </Button>
          </ActionForm>
        </SanctumCard>

        <SanctumCard>
          <ActionForm action={adjustPointsAction}>
            <input type="hidden" name="userId" value={user.id} />
            <Label>{t("adjustEchoes")}</Label>
            <Input name="amount" type="number" required placeholder={t("amountPlaceholder")} />
            <Textarea name="reason" required placeholder={t("reasonPlaceholder")} />
            <Button type="submit">{t("apply")}</Button>
          </ActionForm>
        </SanctumCard>

        <SanctumCard>
          <ActionForm action={addBoosterAction}>
            <input type="hidden" name="userId" value={user.id} />
            <Label>{t("addBooster")}</Label>
            <Select name="boosterTypeId" required>
              {boosters.map((booster) => (
                <option key={booster.id} value={booster.id}>
                  {booster.collectionName} · {booster.name}
                </option>
              ))}
            </Select>
            <Textarea name="reason" required placeholder={t("reasonPlaceholder")} />
            <Button type="submit">{t("addToQueue")}</Button>
          </ActionForm>
        </SanctumCard>
      </div>

      <SanctumSection title={t("collection")} className="mt-16">
        {liveOwned.length === 0 ? (
          <SanctumEmpty>{t("noRelics")}</SanctumEmpty>
        ) : (
          <ul className="space-y-3">
            {liveOwned.map((row) => (
              <li
                key={row.card.id}
                className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/5 py-2"
              >
                <span className="text-[17px] text-[#d7d3c8]/80 italic">
                  {formatCardNumber(row.card.number)} {row.card.name}
                </span>
                <span className="flex items-center gap-3">
                  <RarityBadge rarity={row.card.rarity} />
                  <MutationBadges holographic={row.holographic} signature={row.signature} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </SanctumSection>

      <SanctumSection title={t("titles")} className="mt-16">
        {unlocked.length === 0 ? (
          <SanctumEmpty>{t("noneBestowed")}</SanctumEmpty>
        ) : (
          <ul className="space-y-3">
            {unlocked.map((row) => (
              <li
                key={row.name}
                className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2"
              >
                <span className="font-[family-name:var(--font-cinzel)] text-[12px] text-[#d7d3c8]/80">
                  {row.name}
                </span>
                <span className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-widest text-[#d7d3c8]/30">
                  {formatDate(row.unlockedAt, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SanctumSection>

      <SanctumSection title={t("recentManifestations")} className="mt-16">
        {userDraws.length === 0 ? (
          <SanctumEmpty>{t("noneYet")}</SanctumEmpty>
        ) : (
          <ul className="space-y-3">
            {userDraws.map((draw) => (
              <li
                key={draw.id}
                className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/5 py-2"
              >
                <span className="text-[17px] text-[#d7d3c8]/80 italic">
                  {draw.cardName}
                  {draw.isDuplicate ? (
                    <span className="ml-1 font-[family-name:var(--font-cinzel)] text-[9px] text-[#d4b36a]/60 not-italic uppercase">
                      ({tCommon("echo")})
                    </span>
                  ) : null}
                </span>
                <span className="flex items-center gap-3 font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.12em] text-[#d7d3c8]/40 uppercase">
                  <MutationBadges holographic={draw.holographic} signature={draw.signature} />
                  {formatDate(draw.createdAt, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SanctumSection>

      <SanctumSection title={t("echoes")} className="mt-16">
        {ledger.length === 0 ? (
          <SanctumEmpty>{t("noEchoes")}</SanctumEmpty>
        ) : (
          <ul className="space-y-3">
            {ledger.map((row) => (
              <li
                key={row.id}
                className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2"
              >
                <span className="font-[family-name:var(--font-cinzel)] text-sm text-[#f3efe6]">
                  {row.amount > 0 ? `+${row.amount}` : row.amount}{" "}
                  <span className="text-[#d7d3c8]/70">{tLedger(row.source)}</span>
                  {row.note ? (
                    <span className="ml-2 font-[family-name:var(--font-cormorant)] text-[#d7d3c8]/50 italic">
                      {row.note}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SanctumSection>
    </main>
  );
}

function groupByCollection<T extends { collectionName: string }>(rows: T[]) {
  const groups: { name: string; items: T[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last?.name === row.collectionName) {
      last.items.push(row);
    } else {
      groups.push({ name: row.collectionName, items: [row] });
    }
  }
  return groups;
}
