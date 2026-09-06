# Stream Card Collection System — MVP Requirements

## Overview

A web platform for a Twitch stream community. Viewers log in with Twitch OAuth and maintain a personal profile containing a card collection and collector points. Boosters (card packs) are opened exclusively by the streamer during live broadcasts; the system randomly assigns a drawn card to a selected viewer based on configured drop rates.

**Tech-agnostic scope note:** This document defines functional requirements, user stories, subtasks, acceptance criteria, and definition of done (DoD) for each feature. A recommended architecture is specified below to guide implementation; subtasks assume this stack unless the team decides otherwise.

---

## Proposed Architecture

Chosen for fast setup: everything lives in the Next.js + Supabase ecosystem, minimizing the number of separate services/vendors to wire up for an MVP.

### Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + Backend | **Next.js (App Router)** | Single app for UI, server actions, and API routes — no separate backend service needed. |
| Database | **Supabase (Postgres)** | Managed Postgres plus Realtime, Storage, and Auth helpers in one platform. |
| ORM | **Drizzle** (or Prisma if the team prefers) | Lightweight, strong TypeScript inference, works cleanly with Supabase Postgres. |
| Auth | **NextAuth.js (Auth.js)** with Twitch provider | Twitch OAuth is a built-in provider — removes the need to hand-roll the flow in US-1.1. Use a database adapter so sessions map directly to the `users` table (roles included). |
| Real-time (card reveal) | **Supabase Realtime** (Postgres change subscriptions) | The reveal view (US-3.3) subscribes directly to inserts on the `draws` table — near-zero custom backend code, satisfies the sub-3-second target in NFR-2. |
| Image storage | **Supabase Storage** | Card artwork and admin-uploaded images. |
| Hosting | **Vercel** | Zero-config Next.js deploys, preview environments per PR — useful for QA-ing admin-panel changes. |

### Why this combination

- One deploy target (Vercel) and one data platform (Supabase) — no separate realtime, queue, or storage vendor to configure.
- NextAuth reduces OAuth implementation (US-1.1) to configuration rather than custom flow-building.
- Supabase Realtime removes most custom code from the reveal animation (US-3.3), which is otherwise the trickiest piece to get feeling "live."
- Postgres transactions (via Drizzle/Prisma) give the atomicity required by NFR-1 (draws, duplicates, and points must apply together or not at all) without needing a job queue or saga pattern at this scale.

### Suggested project structure

```
/app
  /(auth)/login
  /(user)/dashboard, /collection, /achievements, /shop, /history
  /(admin)/admin/users, /admin/boosters, /admin/cards, /admin/achievements, /admin/rewards, /admin/history
  /reveal          → OBS browser-source page, subscribes to Supabase Realtime
  /api/auth/[...nextauth]
/db
  schema.ts        → Drizzle schema: users, cards, boosters, draws, points_ledger,
                      achievements, user_achievements, rewards, redemptions
  queries/         → reusable query functions, especially atomic ones
                      (draw + duplicate check + points, in a single transaction)
/lib
  draw-engine.ts   → weighted rarity roll + card selection (pure function — keep
                      dependency-free so the ±2% statistical test in US-3.2 is
                      trivial to write and fast to run)
  rbac.ts          → role guards, shared by server actions and route handlers
```

### Known ceiling (not a near-term concern for this MVP)

- Very high draw volume across many simultaneous streamers would need connection pooling tuning (Supabase provides PgBouncer for this).
- A future need for a fully separate backend (e.g. a Discord bot also triggering draws) is still served fine by the existing Next.js API routes acting as that backend — no rewrite required, just an additional client.

---

## Epic 1: Authentication & User Profiles

### US-1.1 — Twitch OAuth Login
**As a** viewer, **I want to** log in with my Twitch account, **so that** I can access my personal card collection without creating a separate account.

**Subtasks:**
- Register app with Twitch Developer Console, configure OAuth redirect URIs (dev/staging/prod).
- Implement OAuth 2.0 authorization code flow (login button → Twitch consent → callback → session/token issuance).
- On first login, create a new user record (Twitch ID, display name, avatar URL, channel points reference if available).
- On subsequent logins, match existing user by Twitch ID and refresh profile data (avatar/display name may change).
- Implement session persistence (JWT or server session) and logout.
- Handle OAuth failure/denial states gracefully (user cancels, Twitch API error).

**Acceptance Criteria:**
- Given a new viewer, when they click "Login with Twitch" and approve access, then a profile is created and they land on their dashboard.
- Given a returning viewer, when they log in, then their existing profile and collection are loaded (no duplicate account created).
- Given a user denies OAuth consent, when redirected back, then they see a clear error message and can retry.
- Sessions expire after a configurable period and require re-authentication.

**Definition of Done:**
- OAuth flow works end-to-end in staging with a real Twitch test account.
- No Twitch client secret exposed client-side.
- Error states covered by at least one test case each (denial, expired token, network failure).
- Session/token storage reviewed for basic security (httpOnly cookies or equivalent).

---

### US-1.2 — View My Profile
**As a** logged-in viewer, **I want to** see my basic profile info, **so that** I know I'm logged into the right account.

**Subtasks:**
- Display Twitch display name and avatar in the header/navbar.
- Add logout control.

**Acceptance Criteria:**
- Given I'm logged in, then my Twitch username and avatar are visible on every authenticated page.
- Given I click logout, then my session ends and I'm redirected to the login page.

**Definition of Done:**
- Verified on desktop and mobile viewport.

---

## Epic 2: Card Collection

### US-2.1 — Define Card Catalog (Admin)
**As an** admin, **I want to** create and manage the set of collectible cards, **so that** the collection has content before boosters can be opened.

**Subtasks:**
- Design card data model: number (e.g. #001), name, artwork/image, description/lore text, rarity enum (Common, Rare, Epic, Legendary, Joker), active/inactive flag.
- Build admin CRUD screens (create, edit, deactivate) for cards.
- Enforce uniqueness of card number within a collection.
- Support image upload/storage for card artwork.
- Seed the initial 37-card collection (18 Common, 10 Rare, 5 Epic, 3 Legendary, 1 Joker) as launch data.

**Acceptance Criteria:**
- Given an admin, when they create a card with all required fields, then it appears in the catalog and is eligible for future draws.
- Given a card number already exists, when an admin tries to reuse it, then the system rejects the save with a clear error.
- Given the initial dataset is seeded, then exactly 37 cards exist with the specified rarity distribution.

**Definition of Done:**
- Admin can perform full CRUD on cards in staging.
- Seed script/migration produces the exact 37-card set, verified by an automated check (counts per rarity).

---

### US-2.2 — View My Collection
**As a** viewer, **I want to** see all cards in the collection, with cards I own revealed and cards I don't own hidden, **so that** I can track my progress.

**Subtasks:**
- Build collection grid/list view showing all 37 card slots.
- Render owned cards with full artwork, name, description, rarity.
- Render unowned cards as a "?" placeholder (no name/art/lore leaked).
- Display progress counter (e.g. "18/37") prominently.
- Support filtering/sorting by rarity and ownership status (nice-to-have for MVP, but low effort — include if time allows).

**Acceptance Criteria:**
- Given I own a card, then I see its full details (number, name, art, lore, rarity).
- Given I don't own a card, then I only see "?" with its number and rarity is not revealed unless the product decision is to show rarity for unowned cards — **decision required**: confirm with stakeholders whether rarity is visible for undiscovered cards (default assumption for MVP: rarity hidden too, only slot number shown).
- Given I own N of 37 cards, then the progress counter accurately reads "N/37" and updates immediately after a new card is assigned.

**Definition of Done:**
- Collection view tested with 0 cards owned, partial ownership, and full 37/37 ownership.
- Progress counter verified against database state, not client-side cache only.

---

### US-2.3 — Card Detail View
**As a** viewer, **I want to** click into an owned card, **so that** I can read its full lore and details.

**Subtasks:**
- Build card detail modal/page (artwork, name, number, rarity, lore text, date acquired).

**Acceptance Criteria:**
- Given I click an owned card, then a detail view opens showing all its fields including acquisition date.
- Given I click an unowned card, then no detail view opens (or it clearly indicates the card is locked).

**Definition of Done:**
- Verified for at least one card per rarity tier.

---

## Epic 3: Boosters & Drop System

### US-3.1 — Configure Booster Types (Admin)
**As an** admin, **I want to** define booster types with their cost and drop-rate table, **so that** the drop system has rules to follow.

**Subtasks:**
- Data model: booster name, channel-point cost, ordered list of {rarity: probability}, active flag.
- Admin screen to create/edit booster types.
- Validation: probabilities for a booster must sum to 100%.
- Seed initial three booster types:
  - Booster (4000 pts): 65% Common / 25% Rare / 8% Epic / 2% Legendary
  - Booster Pro (8000 pts): 35% Common / 35% Rare / 20% Epic / 8% Legendary / 2% Joker
  - Joker Hunt Booster (16,767 pts): 45% Rare / 35% Epic / 15% Legendary / 5% Joker

**Acceptance Criteria:**
- Given an admin edits a booster's probabilities and they don't sum to 100%, then save is rejected with a clear error.
- Given the seed data is loaded, then all three booster types exist with the exact rates specified above.

**Definition of Done:**
- Automated test confirms each seeded booster's probabilities sum to exactly 100%.

---

### US-3.2 — Open a Booster for a Viewer (Streamer/Admin)
**As a** streamer, **I want to** select a viewer and a booster type and trigger a draw, **so that** the viewer receives a randomly assigned card live on stream.

**Subtasks:**
- Build admin/streamer UI: user search + booster type selector + "Open" action.
- Implement weighted random draw: (1) select rarity per booster's probability table, (2) select a specific card uniformly at random from cards of that rarity within the active collection, (3) exclude/handle the case where the user already owns all cards of that rarity (fallback to duplicate-points flow, see US-4.1).
- Persist a draw record: user, booster type, resulting card, timestamp, admin/streamer who triggered it.
- Assign the card to the user's collection (or grant duplicate points — see Epic 4).
- Trigger the reveal animation on a display suitable for streaming (see US-3.3).

**Acceptance Criteria:**
- Given a streamer selects a user and a booster type and clicks "Open," then the system draws exactly one card according to that booster's rates.
- Given 10,000 simulated draws of a booster type, then the observed rarity distribution is within an acceptable statistical tolerance of the configured probabilities (e.g. ±2%) — validated via a test/simulation script.
- Given a user already owns every card of the drawn rarity, then the system falls back to the duplicate-points award instead of crashing or returning no result.
- Given a draw completes, then the card is immediately reflected in the user's collection view and progress counter.
- Only accounts with admin/streamer role can trigger a draw.

**Definition of Done:**
- Draw endpoint covered by unit tests for: normal draw, all-owned-in-rarity fallback, invalid booster/user IDs, unauthorized access attempt.
- Statistical simulation test included in the test suite and passing.
- Draw is atomic (no double-assignment on retry/network blip) — verified with a concurrency/idempotency test.

---

### US-3.3 — Card Reveal Animation
**As a** streamer, **I want to** show an on-screen animation when a card is drawn, **so that** the moment is engaging for the stream audience.

**Subtasks:**
- Build a "reveal" display view (likely a browser-source-friendly page for OBS) that animates from "?" to the revealed card.
- Trigger reveal in real time after a draw (WebSocket/SSE push from backend, or polling as fallback).
- Handle rarity-based visual differentiation (e.g. different animation/effects intensity per rarity) — nice-to-have for MVP polish, can be scoped down to a single animation style if time-constrained.

**Acceptance Criteria:**
- Given a draw is triggered, then the reveal view updates within a few seconds without manual page refresh.
- Given the reveal view is added as an OBS browser source, then it renders correctly with a transparent or stream-safe background.

**Definition of Done:**
- Verified in an actual OBS browser source, not just a regular browser tab.
- Reveal display tested for at least 3 consecutive draws without requiring a manual refresh.

---

### US-3.4 — Draw History (Admin)
**As an** admin, **I want to** view a history of all past draws, **so that** I can audit and troubleshoot.

**Subtasks:**
- Build a paginated/filterable table: user, booster type, card drawn, timestamp, triggered-by.
- Filters: by user, by date range, by booster type.

**Acceptance Criteria:**
- Given draws have occurred, then the admin can view them in reverse-chronological order with correct data.
- Given a filter is applied, then only matching records are shown.

**Definition of Done:**
- Verified with 100+ seeded draw records for pagination performance.

---

## Epic 4: Duplicates & Collector Points

### US-4.1 — Duplicate Card Conversion
**As a** viewer, **I want to** automatically receive collector points instead of a second copy when I draw a card I already own, **so that** duplicates aren't wasted.

**Subtasks:**
- On draw resolution, check if the user already owns the drawn card.
- If owned: credit points per rarity table (Common 2 / Rare 4 / Epic 10 / Legendary 20 / Joker 50) instead of creating a duplicate ownership record.
- If not owned: assign the card normally.
- Record the duplicate event distinctly in draw history (so admins can see "duplicate → points" vs "new card").
- Update user's point balance atomically with the draw transaction.

**Acceptance Criteria:**
- Given a user draws a card they already own, then they receive the correct point amount for that rarity and no duplicate card record is created.
- Given a user draws a card they don't own, then the card is added and no points are awarded from this rule.
- Point balance updates are atomic with the draw — no scenario where a draw succeeds but points/card fail to apply.

**Definition of Done:**
- Unit tests cover all five rarities for the duplicate path.
- Manual QA: force a duplicate draw in staging and confirm balance and history update correctly.

---

### US-4.2 — Points from Achievements
**As a** viewer, **I want to** earn collector points when I unlock an achievement, **so that** I'm rewarded for milestones beyond just duplicates.

*(See Epic 5 for achievement definitions; this story covers the points-crediting mechanism.)*

**Subtasks:**
- On achievement unlock, credit the configured point reward once.
- Ensure idempotency: an achievement can never be granted/paid out twice for the same user.

**Acceptance Criteria:**
- Given a user meets an achievement's unlock condition, then they receive the point reward exactly once.
- Given the unlock condition is re-evaluated (e.g. system re-checks state), then no duplicate payout occurs.

**Definition of Done:**
- Idempotency verified with a test that re-triggers the evaluation logic multiple times and confirms a single payout.

---

### US-4.3 — Point Balance & Ledger
**As a** viewer, **I want to** see my current point balance and how I earned/spent points, **so that** I understand my account.

**Subtasks:**
- Maintain a running point balance per user.
- Maintain a ledger of point transactions (source: duplicate/achievement/reward-redeem, amount, timestamp).
- Display current balance in the user panel.
- Display transaction history (paginated).

**Acceptance Criteria:**
- Given any point-affecting event, then a corresponding ledger entry is created and the balance reflects it immediately.
- Given a user views their history, then entries are shown in reverse-chronological order with clear source labeling.

**Definition of Done:**
- Balance is always derivable from summing the ledger (no drift between cached balance and ledger — covered by a reconciliation test).

---

## Epic 5: Achievements

### US-5.1 — Define Achievements (Admin)
**As an** admin, **I want to** create and manage achievements with unlock conditions and point rewards, **so that** the system can recognize viewer milestones.

**Subtasks:**
- Data model: name, description, unlock condition type (e.g. first_booster, first_epic, first_legendary, first_joker, cards_collected_threshold, full_collection), threshold value where applicable, point reward, active flag.
- Admin CRUD screens for achievements.
- Seed MVP achievement set: first booster opened, first Epic card, first Legendary card, first Joker obtained, 10 cards collected, full collection completed.

**Acceptance Criteria:**
- Given an admin creates an achievement, then it becomes eligible for evaluation on future qualifying events.
- Given the seed set is loaded, then all six example achievements exist and are active.

**Definition of Done:**
- Admin CRUD verified in staging; seed achievements confirmed present.

---

### US-5.2 — Achievement Evaluation & Unlock
**As a** viewer, **I want to** automatically unlock achievements when I meet their conditions, **so that** I don't have to do anything manual to be rewarded.

**Subtasks:**
- Hook achievement evaluation into relevant events (post-draw, post-collection-update).
- Implement condition checks for each achievement type in the MVP set.
- Grant achievement once, trigger point payout (US-4.2), and record unlock timestamp.
- Notify the user of the unlock (in-app notification banner minimum; toast/animation is a nice-to-have).

**Acceptance Criteria:**
- Given a user opens their first booster ever, then the "first booster" achievement unlocks immediately after the draw resolves.
- Given a user collects their 37th unique card, then the "full collection" achievement unlocks.
- Given an achievement is already unlocked, then it is never granted again to that user.

**Definition of Done:**
- Each of the six seeded achievements has an automated test simulating the unlock condition and verifying single-grant behavior.

---

### US-5.3 — View My Achievements
**As a** viewer, **I want to** see which achievements I've unlocked and which are still locked, **so that** I know what to pursue.

**Subtasks:**
- Build achievements list view: name, description, unlocked/locked state, unlock date if applicable, point reward.
- Decide MVP behavior for locked achievements: show description (spoiler) vs. hide details — **decision required**, default assumption: show name + description but hide unlock date until earned.

**Acceptance Criteria:**
- Given I view my achievements page, then unlocked achievements show their unlock date and locked ones don't.
- Given a new achievement unlocks, then it appears with correct state without requiring a page hard-refresh (soft refresh/poll acceptable for MVP).

**Definition of Done:**
- Verified with a user who has zero, some, and all achievements unlocked.

---

## Epic 6: Rewards Shop

### US-6.1 — Define Rewards (Admin)
**As an** admin, **I want to** create redeemable rewards with a point cost, **so that** viewers have something to spend points on.

**Subtasks:**
- Data model: reward name, description, point cost, stock/availability (unlimited vs. limited quantity), active flag.
- Admin CRUD screens for rewards.

**Acceptance Criteria:**
- Given an admin creates a reward with a point cost, then it appears in the shop for eligible users.
- Given a reward's stock reaches zero (if limited), then it's no longer redeemable and shown as unavailable.

**Definition of Done:**
- Admin CRUD verified in staging with both unlimited and limited-stock rewards.

---

### US-6.2 — Redeem a Reward
**As a** viewer, **I want to** spend my collector points on a reward, **so that** I get value from points I've accumulated.

**Subtasks:**
- Build shop view listing available rewards with cost and affordability indicator (enough points or not).
- Implement redemption action: validate sufficient balance, deduct points, decrement stock (if limited), create a redemption record, add a ledger entry (US-4.3).
- Notify admin of new redemption (queue/list for fulfillment — fulfillment itself, e.g. shipping or manual delivery, is out of scope for MVP beyond recording the request).

**Acceptance Criteria:**
- Given I have enough points, when I redeem a reward, then my balance decreases by the exact cost and a redemption record is created.
- Given I don't have enough points, then redemption is blocked with a clear message and no balance change occurs.
- Given a limited-stock reward sells out mid-request (race condition), then only the available quantity is redeemable — no overselling.

**Definition of Done:**
- Concurrency test: simulate simultaneous redemption requests against a reward with stock of 1; exactly one succeeds.
- Redemption and ledger entry are created atomically.

---

## Epic 7: User Panel

### US-7.1 — User Dashboard
**As a** viewer, **I want to** see a single dashboard summarizing my account, **so that** I can quickly check my status.

**Subtasks:**
- Compose dashboard from existing components: collection progress, point balance, recent card history, recent achievements.
- Provide navigation to full collection, achievements list, history, and shop.

**Acceptance Criteria:**
- Given I log in, then my dashboard shows current collection progress, point balance, and links to all sub-sections without extra loading delay beyond a normal page load.

**Definition of Done:**
- Dashboard loads correctly for a brand-new user (0 cards, 0 points) and an established user with full data.

---

### US-7.2 — Card Acquisition History
**As a** viewer, **I want to** see a chronological log of cards I've obtained, **so that** I can look back on my collecting journey.

**Subtasks:**
- Build paginated history view: card, rarity, date acquired, booster type used.

**Acceptance Criteria:**
- Given I've acquired cards, then they're listed in reverse-chronological order with accurate booster-type attribution.

**Definition of Done:**
- Verified against draw history records for consistency (US-3.4 data source parity).

---

## Epic 8: Admin Panel

### US-8.1 — User Search & Management
**As an** admin, **I want to** search for a specific viewer and view/edit their account, **so that** I can manage the community and resolve issues.

**Subtasks:**
- Build user search (by Twitch username).
- Build user detail view: profile info, collection, point balance, achievement status, draw history.
- Implement manual card grant/revoke action.
- Implement manual point add/deduct action, each creating a ledger entry with an admin-attributed reason/note.

**Acceptance Criteria:**
- Given an admin searches a username, then matching users are returned and selectable.
- Given an admin manually grants a card, then it appears in the user's collection and is logged with the admin's identity and reason.
- Given an admin manually adjusts points, then the ledger reflects the change with admin attribution, and it's distinguishable from system-generated entries.

**Definition of Done:**
- All manual actions are logged with admin identity, timestamp, and reason field (required, not optional) for auditability.
- Role-gated: only admin-role accounts can access this panel (verified with an authorization test).

---

### US-8.2 — Role-Based Access Control
**As a** platform owner, **I want to** restrict admin and streamer functions to authorized accounts, **so that** regular viewers can't open boosters or alter data.

**Subtasks:**
- Define roles: viewer (default), streamer, admin.
- Implement role assignment (likely manual/seeded for MVP — a small trusted team).
- Gate all admin-panel routes/endpoints by role at both UI and API layer.

**Acceptance Criteria:**
- Given a viewer-role account, when they attempt to access an admin endpoint directly (e.g. via API), then the request is rejected with 403.
- Given a streamer-role account, then they can open boosters but cannot necessarily manage catalog/achievements/rewards unless also granted admin — **decision required**: confirm whether "streamer" and "admin" are the same role for MVP or distinct (default assumption: single combined "admin" role for MVP simplicity, split later if needed).

**Definition of Done:**
- Authorization enforced server-side (not just hidden UI) — verified with direct API calls from a non-privileged test account.

---

## Cross-Cutting MVP Requirements

### NFR-1 — Data Integrity for Draws & Points
All operations that affect card ownership or point balances (draws, duplicates, achievement payouts, redemptions, manual admin adjustments) must be atomic and auditable. No operation should be able to partially apply (e.g. card assigned but points not deducted, or vice versa).

**Definition of Done:** Reconciliation test suite confirms point balances always equal the sum of their ledger, and collection state always matches the draw-history "new card" events.

### NFR-2 — Real-Time Feel for Stream Use
Card draws and reveals must feel immediate during a live broadcast (target: under 3 seconds from admin trigger to reveal-view update).

**Definition of Done:** Measured in staging with the actual reveal view under simulated network conditions.

### NFR-3 — Mobile-Friendly Viewer Experience
The user-facing panel (not the admin/streamer tools, which can be desktop-only for MVP) must be usable on mobile browsers, since viewers will check their collection from phones.

**Definition of Done:** Manual QA pass on at least one iOS and one Android browser for dashboard, collection, achievements, and shop views.

### NFR-4 — Basic Rate Limiting & Abuse Prevention
Prevent spam/abuse of admin-triggered actions (e.g. accidental double-clicks causing double draws).

**Definition of Done:** Draw endpoint is idempotent per request or debounced client-side + server-side guarded against duplicate submission within a short window.

---

## Open Product Decisions (flag before development starts)

1. Whether rarity is visible for undiscovered ("?") cards, or fully hidden.
2. Whether "streamer" and "admin" are the same role for MVP, or separate permission levels.
3. How reward fulfillment works operationally (manual, out-of-band) — MVP only needs to record the redemption request.
4. Whether locked-achievement descriptions are visible (spoilers) or hidden until unlocked.
5. Source of "channel points" balance for booster cost — is this pulled live from Twitch's Channel Points API, or tracked independently within this system? This materially affects the scope of Epic 3 and should be resolved first, as it is a blocking architectural decision.

---

## Suggested MVP Build Order

1. Epic 1 (Auth) → 2 (Collection catalog + admin CRUD) → foundation, nothing else works without this.
2. Epic 3 (Boosters + draw engine) — the core mechanic.
3. Epic 4 (Duplicates + points) — tightly coupled to the draw engine, build alongside Epic 3.
4. Epic 8 (Admin panel basics: user search, manual overrides, RBAC) — needed to operate Epic 3 safely.
5. Epic 5 (Achievements) — depends on draw/collection events existing.
6. Epic 6 (Rewards shop) — depends on the points system being stable.
7. Epic 7 (User dashboard polish) — can be built incrementally throughout, finalized last.
