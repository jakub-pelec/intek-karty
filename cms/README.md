# Intek catalog CMS

Strapi 5 is the editor for collections, cards, boosters (including drop rates and pack art), titles, and shop offerings.

## First run

```bash
cd cms
cp .env.example .env
# Replace every toBeModified / tobemodified value with random strings
pnpm install
pnpm develop
```

SQLite lives at `cms/data/data.db`. Card and pack art live in `cms/public/uploads/`. Both sit outside `dist/`, so `pnpm develop` / `pnpm build` do not wipe them.

On a production host, mount a persistent volume over `cms/data` and `cms/public/uploads` (or set `DATABASE_FILENAME` to a path on that volume). Do not point the database at `dist/` or `.tmp/`.

Open `http://localhost:1337/admin`, create the first admin user, then:

1. **Settings → API Tokens** — create a full-access token. Put it in the Next app as `STRAPI_TOKEN`.
2. **Settings → Users & Permissions → Public** — you can leave public finds off; the Next pull uses the token.
3. **Settings → Webhooks** — URL `http://localhost:3000/api/cms/sync`, events `entry.create`, `entry.update`, `entry.publish`, `entry.unpublish`, `entry.delete`, and the three media events. Header `x-cms-sync-secret` = the Next app `CMS_SYNC_SECRET` (same value as `.env.local`, no quotes). Use **Trigger** — a working hook returns `{ "action": "synced", ... }`. The Next terminal should log `[cms-sync]`.
4. Publish at least one Collection (with a **back image**), then Cards and Boosters that belong to it. Drop rates on a booster must sum to **100%**. The collection back is used on 3D card reverses and unseen slots.
5. From the repo root, after `pnpm db:migrate` (and after every publish if the webhook is not set):

```bash
pnpm cms:pull
```

The Next app never reads Strapi live. A full pull upserts only by Strapi document id. Leftover admin/seed catalog rows are retired and hidden. Publish the **cards** (and boosters) too, not only the collection.

Unpublishing or deleting an entry sets `active = false` in Postgres. Cards and rewards are never hard-deleted (draws and ownership keep their foreign keys).

**Reward stock:** publishing a reward overwrites `rewards.stock` in Postgres. Viewer redeems only decrement Postgres. Republishing resets the counter to the Strapi value.
