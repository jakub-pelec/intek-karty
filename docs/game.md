# Lineup duel

A 6-card game layered on the binder. Collect relics as before. Build a lineup from copies you own, then queue into a match against a nearby rating. The opponent does not have to be online.

This file is the living rules sheet.

## Match shape

1. Each player locks one **queue-ready** lineup of 6 unique catalog cards.
2. Players are paired by stored rating (start at 1000). Closest rating wins the matchup even if that player is offline; their saved lineup is snapshotted at lock time.
3. Both lineups sit face-down. Cards flip **slot 1 → 6**.
4. After every flip, `scoreLineup(cards, revealedCount)` runs. Only **revealed** cards score. Synergies tick in as allies appear.
5. When slot 6 lands, totals compare. Ranked duels update Elo (`K = 32`). Practice does not.

An open ranked duel is resumed instead of creating a second one. Practice always starts a new board against a generated catalog **shade** (no second account, no rating change).

## Deck rules

- Size is **6**. No duplicates of the same catalog card in one lineup.
- Pool is **owned copies** (`user_cards`). Unsigned and signed prints of the same number are different catalog cards. Holo is a flag on the copy.
- Several **named lineups** per user (cap 8). The same owned card may sit in more than one saved lineup. One lineup may be marked **queue-ready**, and only a full valid 6 can be.
- Incomplete lineups can be saved.

## Points

Each card has a **base value** authored in Strapi. Suggested rarity defaults if a row has no explicit value:

| Rarity | Base |
| --- | --- |
| common | 3 |
| rare | 5 |
| epic | 8 |
| legendary | 12 |
| joker | 15 |

**Copy bonuses** (code constants, not CMS):

- Holographic: **+2**
- Signed: **+3**

Future variants (alt art, etc.) should follow the same copy-bonus pattern.

## Tags

Streamer-flavored tribes. A card may have several.

`chat` · `hype` · `raid` · `food` · `cat` · `mod` · `clutch` · `night` · `sub` · `overlay`

Example: a cat card with `per_tag` / `food` gains points for every other revealed food ally.

## Effects — implemented

Scored only among **revealed** cards. `effectValue` is **N**. `effectThreshold` is **K** (tribe). `effectTag` is **T**.

| Kind | When it pays |
| --- | --- |
| `per_tag` | +N for each *other* revealed ally with tag T |
| `tribe` | +N if at least K revealed cards (including self) have tag T |
| `lone` | +N if no other revealed ally shares this card’s primary tag (`effectTag`, else first tag) |
| `high_rarity` | +N per revealed epic, legendary, or joker (including self) |

## Effects — ideas (not in the engine yet)

- **Pair** — +N if a specific card number is also revealed.
- **All unique** — +N if all revealed cards have distinct primary tags.
- **Joker copy** — this card scores the highest ally effect currently showing.
- **Night crew** — +N if 2+ `night` cards are revealed.
- **Hydrate** — +N per revealed `food` (same shape as `per_tag`, flavor text only).
- **Overlay artist** — +N per revealed `hype`.
- **Signed aura** — extra if *this copy* is signed (partly covered by the signed copy bonus).
- **Raid caller** — +N if a `raid` ally is revealed in an earlier slot (order-sensitive).
- **Hype train car** — +N per consecutive `hype` card already revealed.

## Authoring

Points, tags, and effects live on the **Card** type in Strapi and sync into `cards`. Tune there; do not hardcode per-card bonuses in the app except copy-variant constants.

## Later design (not live)

Parked product notes, not rules: [`docs/game-ideas/`](./game-ideas/README.md). Cross-board scoring is the active discovery topic; construction, presentation, and extra RNG live there until they get their own brief.

## Solo / dev

`/deck` has **Practice** (shade) and **Find opponent** (ranked). `/admin/dev` can also pick a specific queue-ready user. On a practice board — and for admins on any board — **Reveal all**, **Rewind**, **God view**, and **Auto reveal** drive the same reveal pipeline as a live duel.
