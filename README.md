# Intek Binder

Twitch stream card collection: viewers log in with Twitch, Channel Point redemptions enqueue boosters, and the streamer opens them live.

Twitch Channel Points buy boosters. Collector points are a separate in-app currency earned from duplicates and achievements.

## Stack

Next.js App Router, Auth.js (Twitch), Drizzle, Supabase Postgres, Supabase Storage / Realtime, Vercel.

## Setup

1. Copy `.env.example` to `.env.local` and fill in values.
2. Create a [Twitch application](https://dev.twitch.tv/console/apps) with OAuth redirect `http://localhost:3000/api/auth/callback/twitch` (plus your production URL).
3. Create a Supabase project. Use the **pooled** connection string as `DATABASE_URL` (port `6543`, add `?sslmode=require`). Copy the project URL plus **publishable** / **secret** keys from **Settings → API Keys** (or legacy `anon` / `service_role`).
4. Push the schema and seed:

```bash
npm install
npx drizzle-kit generate
npx drizzle-kit migrate
npm run db:seed
npm run db:seed:boosters
```

If you prefer, `npx drizzle-kit push` applies the schema without migration files.

5. In Twitch, create three Channel Point rewards matching the seeded boosters (4000 / 8000 / 16767). Paste each reward ID into **Admin → Boosters**.
6. Subscribe to EventSub `channel.channel_points_custom_reward_redemption.add` pointing at `https://<your-host>/api/twitch/eventsub`. The verify secret must match `TWITCH_EVENTSUB_SECRET`. Locally, expose the app with a tunnel (Cloudflare Tunnel or ngrok).
7. Put your Twitch user id in `ADMIN_TWITCH_IDS` so the first login is an admin.
8. Optional Realtime overlay: run the SQL in `drizzle/realtime.sql` in the Supabase SQL editor, then add `https://<host>/reveal` as an OBS browser source (transparent background). The overlay also polls `/api/reveal/latest` if Realtime is not enabled.

```bash
npm run dev
npm test
```

## Product rules

- Unowned collection slots show only the card number and `?` (rarity hidden).
- MVP uses a single `admin` role. Viewers cannot open boosters.
- Shop redemptions are recorded for manual fulfillment.
- Opening a pending booster is atomic: `pending → opened` in the same transaction as the card or duplicate points.

## Tests

`npm test` covers seed counts, drop-rate sums, ±2% statistical draws, duplicate point table, EventSub signatures, and achievement conditions.
