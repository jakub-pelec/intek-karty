import { asc, desc, eq } from "drizzle-orm";
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
      .where(eq(boosterTypes.active, true))
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

  const ownedIds = new Set(owned.map((row) => row.card.id));

  return (
    <main className="mx-auto w-full max-w-4xl pt-2 md:pt-6">
      <RitualPageHeader
        title={user.name}
        eyebrow={`Twitch ${user.twitchId} · ${user.role} · ${user.pointsBalance} echoes`}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <SanctumCard>
          <ActionForm action={grantCardAction}>
            <input type="hidden" name="userId" value={user.id} />
            <Label>Grant card</Label>
            <Select name="cardId" required>
              {groupByCollection(
                catalog.filter((card) => !ownedIds.has(card.id)),
              ).map((group) => (
                <optgroup key={group.name} label={group.name}>
                  {group.items.map((card) => (
                    <option key={card.id} value={card.id}>
                      {formatCardNumber(card.number)} {card.name}
                      {card.signed ? " (signed)" : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
            <Textarea name="reason" required placeholder="Reason (required)" />
            <Button type="submit">Grant</Button>
          </ActionForm>
        </SanctumCard>

        <SanctumCard>
          <ActionForm action={revokeCardAction}>
            <input type="hidden" name="userId" value={user.id} />
            <Label>Revoke card</Label>
            <Select name="cardId" required>
              {owned.map((row) => (
                <option key={row.card.id} value={row.card.id}>
                  {formatCardNumber(row.card.number)} {row.card.name}
                </option>
              ))}
            </Select>
            <Textarea name="reason" required placeholder="Reason (required)" />
            <Button type="submit" variant="danger">
              Revoke
            </Button>
          </ActionForm>
        </SanctumCard>

        <SanctumCard>
          <ActionForm action={adjustPointsAction}>
            <input type="hidden" name="userId" value={user.id} />
            <Label>Adjust echoes</Label>
            <Input name="amount" type="number" required placeholder="e.g. 10 or -5" />
            <Textarea name="reason" required placeholder="Reason (required)" />
            <Button type="submit">Apply</Button>
          </ActionForm>
        </SanctumCard>

        <SanctumCard>
          <ActionForm action={addBoosterAction}>
            <input type="hidden" name="userId" value={user.id} />
            <Label>Add booster to queue</Label>
            <Select name="boosterTypeId" required>
              {boosters.map((booster) => (
                <option key={booster.id} value={booster.id}>
                  {booster.collectionName} · {booster.name}
                </option>
              ))}
            </Select>
            <Textarea name="reason" required placeholder="Reason (required)" />
            <Button type="submit">Add to queue</Button>
          </ActionForm>
        </SanctumCard>
      </div>

      <SanctumSection title="Collection" className="mt-16">
        {owned.length === 0 ? (
          <SanctumEmpty>No relics bound.</SanctumEmpty>
        ) : (
          <ul className="space-y-3">
            {owned.map((row) => (
              <li
                key={row.card.id}
                className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/5 py-2"
              >
                <span className="text-[15px] text-[#d7d3c8]/80 italic">
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

      <SanctumSection title="Titles" className="mt-16">
        {unlocked.length === 0 ? (
          <SanctumEmpty>None bestowed.</SanctumEmpty>
        ) : (
          <ul className="space-y-3">
            {unlocked.map((row) => (
              <li
                key={row.name}
                className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2"
              >
                <span className="font-[family-name:var(--font-cinzel)] text-[11px] text-[#d7d3c8]/80">
                  {row.name}
                </span>
                <span className="font-[family-name:var(--font-cinzel)] text-[8px] tracking-widest text-[#d7d3c8]/30">
                  {formatDate(row.unlockedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SanctumSection>

      <SanctumSection title="Recent manifestations" className="mt-16">
        {userDraws.length === 0 ? (
          <SanctumEmpty>None yet.</SanctumEmpty>
        ) : (
          <ul className="space-y-3">
            {userDraws.map((draw) => (
              <li
                key={draw.id}
                className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/5 py-2"
              >
                <span className="text-[15px] text-[#d7d3c8]/80 italic">
                  {draw.cardName}
                  {draw.isDuplicate ? (
                    <span className="ml-1 font-[family-name:var(--font-cinzel)] text-[8px] text-[#d4b36a]/60 not-italic uppercase">
                      (Echo)
                    </span>
                  ) : null}
                </span>
                <span className="flex items-center gap-3 font-[family-name:var(--font-cinzel)] text-[8px] tracking-[0.12em] text-[#d7d3c8]/40 uppercase">
                  <MutationBadges holographic={draw.holographic} signature={draw.signature} />
                  {formatDate(draw.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SanctumSection>

      <SanctumSection title="Echoes" className="mt-16">
        {ledger.length === 0 ? (
          <SanctumEmpty>No echoes yet.</SanctumEmpty>
        ) : (
          <ul className="space-y-3">
            {ledger.map((row) => (
              <li
                key={row.id}
                className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2"
              >
                <span className="font-[family-name:var(--font-cinzel)] text-sm text-[#f3efe6]">
                  {row.amount > 0 ? `+${row.amount}` : row.amount}{" "}
                  <span className="text-[#d7d3c8]/70">{row.source}</span>
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
