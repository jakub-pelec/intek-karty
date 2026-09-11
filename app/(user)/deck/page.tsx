import { DeckBuilder } from "@/components/deck-builder";
import { listDecks, listOwnedDeckCards } from "@/db/queries/decks";
import { findOpenRankedMatch } from "@/db/queries/matches";
import { requireUser } from "@/lib/rbac";

export default async function DeckPage({
  searchParams,
}: {
  searchParams: Promise<{ deck?: string | string[] }>;
}) {
  const params = await searchParams;
  const deckParam = Array.isArray(params.deck) ? params.deck[0] : params.deck;
  const user = await requireUser();
  const [owned, decks, open] = await Promise.all([
    listOwnedDeckCards(user.id),
    listDecks(user.id),
    findOpenRankedMatch(user.id),
  ]);
  const selected =
    decks.find((deck) => deck.id === deckParam) ??
    decks.find((deck) => deck.isActive) ??
    decks[0] ??
    null;

  return (
    <main className="mx-auto w-full max-w-[104rem] px-4 pt-8 pb-16 md:px-8 md:pt-6">
      <DeckBuilder
        owned={owned}
        decks={decks}
        selectedDeckId={selected?.id ?? null}
        rating={user.rating}
        openMatchId={open?.id ?? null}
      />
    </main>
  );
}
