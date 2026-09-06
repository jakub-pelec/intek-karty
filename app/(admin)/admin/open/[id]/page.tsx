import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BoosterOpenStage } from "@/components/booster-open-stage";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { getDb } from "@/db";
import { boosterTypes, draws, userBoosters, users } from "@/db/schema";

export default async function AdminOpenBoosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const [row] = await db
    .select({
      id: userBoosters.id,
      status: userBoosters.status,
      note: userBoosters.note,
      twitchId: userBoosters.twitchId,
      userName: users.name,
      boosterName: boosterTypes.name,
      frontImageUrl: boosterTypes.frontImageUrl,
      backImageUrl: boosterTypes.backImageUrl,
    })
    .from(userBoosters)
    .leftJoin(users, eq(userBoosters.userId, users.id))
    .innerJoin(boosterTypes, eq(userBoosters.boosterTypeId, boosterTypes.id))
    .where(eq(userBoosters.id, id))
    .limit(1);

  if (!row || row.status === "cancelled") notFound();

  const viewerName = row.userName ?? `twitch:${row.twitchId}`;
  let initialDraw = null;
  if (row.status === "opened") {
    const [draw] = await db
      .select({
        cardName: draws.cardName,
        cardNumber: draws.cardNumber,
        cardRarity: draws.cardRarity,
        cardImageUrl: draws.cardImageUrl,
        holographic: draws.holographic,
        signature: draws.signature,
        isDuplicate: draws.isDuplicate,
        pointsAwarded: draws.pointsAwarded,
      })
      .from(draws)
      .where(eq(draws.userBoosterId, row.id))
      .limit(1);
    if (draw) {
      initialDraw = {
        name: draw.cardName,
        number: draw.cardNumber,
        rarity: draw.cardRarity,
        imageUrl: draw.cardImageUrl,
        holographic: draw.holographic,
        signature: draw.signature,
        isDuplicate: draw.isDuplicate,
        pointsAwarded: draw.pointsAwarded,
        message: draw.isDuplicate
          ? `Duplicate ${draw.cardName} — ${draw.pointsAwarded} points`
          : `Opened ${draw.cardName}`,
      };
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader
        title="Open"
        eyebrow={row.note ? `${viewerName} · ${row.note}` : viewerName}
      />
      <BoosterOpenStage
        userBoosterId={row.id}
        boosterName={row.boosterName}
        viewerName={viewerName}
        frontImageUrl={row.frontImageUrl}
        backImageUrl={row.backImageUrl}
        initialDraw={initialDraw}
      />
    </main>
  );
}
