import {
  COPY_BONUS,
  copyBonusFor,
  HIGH_RARITIES,
  primaryTag,
  type PlayCard,
  type LineupScore,
  type ScoreAlly,
  type ScoreNote,
  type ScoreRow,
} from "@/lib/game/types";

function revealedSlice(cards: PlayCard[], revealedCount?: number) {
  const count =
    revealedCount === undefined
      ? cards.length
      : Math.max(0, Math.min(cards.length, revealedCount));
  return cards.slice(0, count);
}

function asAlly(card: PlayCard): ScoreAlly {
  return { cardId: card.cardId, name: card.name };
}

function effectBreakdown(card: PlayCard, revealed: PlayCard[]) {
  const n = card.effectValue ?? 0;
  const notes: ScoreNote[] = [];
  if (!card.effectKind || n === 0) return { effect: 0, notes };

  if (card.effectKind === "per_tag") {
    if (!card.effectTag) return { effect: 0, notes };
    const allies = revealed.filter(
      (ally) =>
        ally.cardId !== card.cardId && ally.tags.includes(card.effectTag!),
    );
    const effect = n * allies.length;
    if (effect > 0) {
      notes.push({
        kind: "per_tag",
        amount: effect,
        tag: card.effectTag,
        per: n,
        allies: allies.map(asAlly),
      });
    } else {
      notes.push({ kind: "per_tag_waiting", tag: card.effectTag });
    }
    return { effect, notes };
  }

  if (card.effectKind === "tribe") {
    if (!card.effectTag) return { effect: 0, notes };
    const need = card.effectThreshold ?? 3;
    const allies = revealed.filter((ally) => ally.tags.includes(card.effectTag!));
    const count = allies.length;
    if (count >= need) {
      notes.push({
        kind: "tribe",
        amount: n,
        tag: card.effectTag,
        threshold: need,
        count,
        allies: allies.map(asAlly),
      });
      return { effect: n, notes };
    }
    notes.push({
      kind: "tribe_waiting",
      tag: card.effectTag,
      threshold: need,
      count,
    });
    return { effect: 0, notes };
  }

  if (card.effectKind === "lone") {
    const tag = primaryTag(card);
    if (!tag) return { effect: 0, notes };
    const others = revealed.filter(
      (ally) => ally.cardId !== card.cardId && ally.tags.includes(tag),
    );
    if (others.length === 0) {
      notes.push({ kind: "lone", amount: n, tag });
      return { effect: n, notes };
    }
    notes.push({ kind: "lone_blocked", tag, allies: others.map(asAlly) });
    return { effect: 0, notes };
  }

  if (card.effectKind === "high_rarity") {
    const allies = revealed.filter((ally) =>
      (HIGH_RARITIES as readonly string[]).includes(ally.rarity),
    );
    const effect = n * allies.length;
    if (effect > 0) {
      notes.push({
        kind: "high_rarity",
        amount: effect,
        per: n,
        allies: allies.map(asAlly),
      });
    }
    return { effect, notes };
  }

  return { effect: 0, notes };
}

export function scoreLineup(
  cards: PlayCard[],
  revealedCount?: number,
): LineupScore {
  const revealed = revealedSlice(cards, revealedCount);
  const rows: ScoreRow[] = revealed.map((card) => {
    const base = card.basePoints;
    const copyBonus = copyBonusFor(card);
    const { effect, notes: effectNotes } = effectBreakdown(card, revealed);
    const notes: ScoreNote[] = [{ kind: "base", amount: base }];
    if (card.holographic) {
      notes.push({ kind: "copy_holo", amount: COPY_BONUS.holographic });
    }
    if (card.signed) {
      notes.push({ kind: "copy_signed", amount: COPY_BONUS.signed });
    }
    notes.push(...effectNotes);
    return {
      cardId: card.cardId,
      name: card.name,
      base,
      copyBonus,
      effect,
      subtotal: base + copyBonus + effect,
      notes,
    };
  });
  return {
    total: rows.reduce((sum, row) => sum + row.subtotal, 0),
    rows,
  };
}
