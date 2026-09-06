# Intek Binder

Twitch stream card collection: viewers log in with Twitch, Channel Point redemptions enqueue boosters, and the streamer opens them live.

Twitch Channel Points buy boosters. Collector points are a separate in-app currency earned from duplicates and achievements.

Catalog (collections, cards, boosters and drop rates, titles, shop offerings, and artwork) is edited in **Strapi** and synced into Postgres. The Inner Sanctum only handles live ops: queue, opens, users, fulfillment, and draw history.

## Stack

Next.js App Router, Auth.js (Twitch), Drizzle, Supabase Postgres, Strapi 5, Supabase Realtime, Vercel.

## Setup

1. Copy `.env.example` to `.env.local` and fill in values.
2. Create a [Twitch application](https://dev.twitch.tv/console/apps) with OAuth redirect `http://localhost:3000/api/auth/callback/twitch` (plus your staging and production URLs).
3. Create a Supabase project. Use the **pooled** connection string as `DATABASE_URL` (port `6543`, add `?sslmode=require`). Copy the project URL plus **publishable** / **secret** keys from **Settings → API Keys**.
4. Apply migrations:

```bash
pnpm install
pnpm db:migrate
```

5. Start Strapi (see [`cms/README.md`](cms/README.md)), create an API token, set `STRAPI_URL`, `STRAPI_TOKEN`, and `CMS_SYNC_SECRET` in `.env.local`. Publish collections, cards, boosters (rates must sum to 100%), titles, and rewards. Then:

```bash
pnpm cms:pull
pnpm db:seed
```

`db:seed` always pulls catalog from Strapi (`STRAPI_URL` + `STRAPI_TOKEN` required). Demo user, owned cards, and queues seed against that catalog. Leftover rows from the old in-app editor are retired and hidden.

6. In Twitch, create Channel Point rewards matching the boosters. Put each reward ID on the booster in Strapi and pull again (or rely on the webhook).
7. Subscribe to EventSub `channel.channel_points_custom_reward_redemption.add` pointing at `https://<your-host>/api/twitch/eventsub`. The verify secret must match `TWITCH_EVENTSUB_SECRET`. Locally, expose the app with a tunnel.
8. Put your Twitch user id in `ADMIN_TWITCH_IDS` so the first login is an admin.
9. Point the Strapi webhook at `https://<your-host>/api/cms/sync` with header `x-cms-sync-secret`. Unpublish/delete sets `active = false` in Postgres; cards and rewards are never hard-deleted.

**Reward stock:** publishing a reward in Strapi overwrites `rewards.stock` in Postgres. Redeems only decrement Postgres. Republishing resets the counter to the Strapi value.

Optional Realtime overlay: run the SQL in `drizzle/realtime.sql` in the Supabase SQL editor, then add `https://<host>/reveal` as an OBS browser source.

```bash
pnpm cms:develop
pnpm dev
pnpm test
```

## Product rules

- Unowned collection slots show the collection back, dimmed, with a `?` (rarity hidden).
- MVP uses a single `admin` role. Viewers cannot open boosters.
- Shop redemptions are recorded for manual fulfillment in **Admin → Fulfillment**.
- Opening a pending booster is atomic: `pending → opened` in the same transaction as the card or duplicate points.

## Tests

`pnpm test` covers seed counts, drop-rate sums, CMS mapping, ±2% statistical draws, duplicate point table, EventSub signatures, and achievement conditions.

## Staging deploy

Vercel hosts the Next app (repo root). Strapi is a separate host with a persistent volume on `cms/data` and `cms/public/uploads`.

1. **Commit and push** the current tree (still local on `master`).
2. Create a Vercel project on this repo. Set env from `.env.example`:
   - `AUTH_SECRET`, `AUTH_URL=https://<staging-host>`
   - `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_EVENTSUB_SECRET`, `ADMIN_TWITCH_IDS`
   - `DATABASE_URL` (Supabase pooler, `sslmode=require`)
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
   - `STRAPI_URL`, `STRAPI_TOKEN`, `CMS_SYNC_SECRET`
3. Apply migrations against that database: `pnpm db:migrate`.
4. In the [Twitch app](https://dev.twitch.tv/console/apps), add redirect `https://<staging-host>/api/auth/callback/twitch`.
5. Point EventSub `channel.channel_points_custom_reward_redemption.add` at `https://<staging-host>/api/twitch/eventsub`.
6. Deploy / start Strapi, then in Strapi:
   - API token → `STRAPI_TOKEN`
   - Webhook `https://<staging-host>/api/cms/sync` with header `x-cms-sync-secret`
   - Publish collections **with a back image**, then cards and boosters
7. From a machine that can reach both: `pnpm cms:pull` (or rely on the webhook). Do not run `db:seed` on staging unless you want demo users and queues.
8. Optional overlay: run `drizzle/realtime.sql` in Supabase, then add `https://<staging-host>/reveal` in OBS.
