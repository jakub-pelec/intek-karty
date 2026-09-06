import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import { boosterTypes, draws, pointsLedger } from "@/db/schema";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { RarityGem } from "@/components/rarity-gem";
import { requireUser } from "@/lib/rbac";
import { LEDGER_SOURCE_LABELS, PAGE_SIZE } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const tab = params.tab === "points" ? "points" : "cards";
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const db = getDb();
  const offset = (page - 1) * PAGE_SIZE;

  const cardRows = await db
    .select({
      id: draws.id,
      cardName: draws.cardName,
      cardNumber: draws.cardNumber,
      cardRarity: draws.cardRarity,
      holographic: draws.holographic,
      signature: draws.signature,
      isDuplicate: draws.isDuplicate,
      createdAt: draws.createdAt,
      boosterName: boosterTypes.name,
    })
    .from(draws)
    .leftJoin(boosterTypes, eq(draws.boosterTypeId, boosterTypes.id))
    .where(eq(draws.userId, user.id))
    .orderBy(desc(draws.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const ledgerRows = await db
    .select()
    .from(pointsLedger)
    .where(eq(pointsLedger.userId, user.id))
    .orderBy(desc(pointsLedger.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const rows = tab === "cards" ? cardRows : ledgerRows;
  const hasMore = rows.length === PAGE_SIZE;

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader
        title="Chronicle"
        eyebrow={`${user.pointsBalance} echoes gathered`}
      />
      <div className="mb-8 flex justify-center gap-10">
        <Link
          href="/history"
          className={cn(
            "ritual-ember border-b pb-0.5 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.24em] uppercase",
            tab === "cards"
              ? "border-[#d4b36a] text-[#d4b36a]"
              : "border-transparent text-[#d7d3c8]",
          )}
        >
          Manifestations
        </Link>
        <Link
          href="/history?tab=points"
          className={cn(
            "ritual-ember border-b pb-0.5 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.24em] uppercase",
            tab === "points"
              ? "border-[#d4b36a] text-[#d4b36a]"
              : "border-transparent text-[#d7d3c8]",
          )}
        >
          Echoes
        </Link>
      </div>

      {tab === "cards" ? (
        cardRows.length === 0 ? (
          <p className="text-center text-[#d7d3c8] italic">None yet.</p>
        ) : (
          <ul className="border border-[#d4b36a]/30 bg-[#0c0b12] px-6">
            {cardRows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 border-b border-[#d7d3c8]/15 py-4 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-3 w-3 shrink-0">
                    <RarityGem rarity={row.cardRarity} />
                  </span>
                  <span className="truncate text-base text-[#f3efe6] italic">
                    {String(row.cardNumber).padStart(2, "0")} {row.cardName}
                    {row.isDuplicate ? (
                      <span className="ml-1 font-[family-name:var(--font-cinzel)] text-[11px] text-[#d4b36a] not-italic uppercase">
                        (Echo)
                      </span>
                    ) : null}
                    {row.signature ? (
                      <span className="ml-1 font-[family-name:var(--font-cinzel)] text-[11px] text-[#d4b36a] not-italic uppercase">
                        (Signed)
                      </span>
                    ) : null}
                  </span>
                </div>
                <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-xs tracking-[0.12em] text-[#cfc6b4] uppercase">
                  {formatDate(row.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : ledgerRows.length === 0 ? (
        <p className="text-center text-[#d7d3c8] italic">No echoes yet.</p>
      ) : (
        <ul className="border border-[#d4b36a]/30 bg-[#0c0b12] px-6">
          {ledgerRows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 border-b border-[#d7d3c8]/15 py-4 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-cinzel)] text-base text-[#f3efe6]">
                  {row.amount > 0 ? `+${row.amount}` : row.amount}{" "}
                  <span className="text-[#d7d3c8]">
                    {LEDGER_SOURCE_LABELS[row.source]}
                  </span>
                </p>
                {row.note ? (
                  <p className="mt-1 truncate text-sm text-[#d7d3c8]">{row.note}</p>
                ) : null}
              </div>
              <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-xs tracking-[0.12em] text-[#cfc6b4] uppercase">
                {formatDate(row.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {page > 1 || hasMore ? (
        <div className="mt-10 flex justify-center gap-10">
          {page > 1 ? (
            <Link
              href={`/history?tab=${tab}&page=${page - 1}`}
              className="font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.2em] text-[#d7d3c8] uppercase hover:text-[#d4b36a]"
            >
              Previous
            </Link>
          ) : null}
          {hasMore ? (
            <Link
              href={`/history?tab=${tab}&page=${page + 1}`}
              className="font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.2em] text-[#d7d3c8] uppercase hover:text-[#d4b36a]"
            >
              Next
            </Link>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
