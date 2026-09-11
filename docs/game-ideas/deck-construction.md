# Idea: deck construction and drawbacks

**Status:** parked. Not the current brief (that is cross-board scoring).

**Problem this would solve:** a deep binder can queue six best relics with no cost. Ranked becomes a collection check. Deckbuilding has no real decision.

**Who it hits:** anyone who can mark a lineup queue-ready. New collectors with a thin pool are the ones who lose if we do nothing. Admins / CMS authors would feel it when card power is tuned.

## What was already decided (soft)

- Primary lever for “too OP” is **construction**, not in-match choices (the duel stays watch-the-reveal).
- A **mix is allowed**: hard limits *and* printed drawbacks. They do different jobs:
  - **Limits** are the backstop. Some lineups are simply illegal to queue (example shape: rarity curve, max copies of a tag, max combined base points). The whale cannot ignore this.
  - **Drawbacks** are the puzzle. A legal greedy lineup can still be a bad idea because the strong cards tax you (negative effects, anti-synergy, “this is huge unless X”).
- Do not use drawbacks *instead of* a cap and hope players play fair. Caps stop the broken table; drawbacks make the legal table interesting.
- New negative card effects are **not** required for the current cross-board brief. Scores going down because the *enemy board* broke a condition (e.g. `lone`) is interaction, not a construction system.

## Mix that is still unspecified

Do not invent numbers yet. Next discovery must pick:

1. What the backstop actually is (rarity quota vs point budget vs tag quota vs “must include low-rarity”).
2. Whether signed/holo copies count as extra power in the cap.
3. Whether incomplete saved lineups can violate the cap (today incomplete is allowed; queue-ready is the gate).
4. How the deck UI shows “this lineup cannot queue” vs “this lineup is legal but fighting itself.”
5. Whether drawbacks are a new effect kind, extra tags, or authoring discipline on existing kinds.

## Explicit non-goals until rediscovered

- In-match decisions (which card to flip, items, mulligans).
- Dice / extra RNG (see `rng-events.md`).
- Using construction as a substitute for cross-board scoring.

## Open questions

- Is the first shippable slice **only the cap** (80% of whale control) with drawbacks later?
- Does practice vs shade use the same legality as ranked?
- If two lineups were queue-ready under old rules, what happens on the patch — auto-unready, or grandfather until they edit?
