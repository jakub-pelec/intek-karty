import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { draws } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const [draw] = await db
      .select({
        id: draws.id,
        viewerName: draws.viewerName,
        cardName: draws.cardName,
        cardNumber: draws.cardNumber,
        cardRarity: draws.cardRarity,
        cardImageUrl: draws.cardImageUrl,
        isDuplicate: draws.isDuplicate,
        holographic: draws.holographic,
        signature: draws.signature,
      })
      .from(draws)
      .orderBy(desc(draws.createdAt))
      .limit(1);
    return NextResponse.json(draw ?? null);
  } catch {
    return NextResponse.json(null);
  }
}
