# Page dependency trees

## /dashboard
Entry: `app/(user)/dashboard/page.tsx`
- `app/(user)/layout.tsx` → `components/app-shell.tsx` → `components/ui/button.tsx`
- `components/ui/panel.tsx` (PageHeader)
- `components/ui/badge.tsx` (RarityBadge, MutationBadges)
- `lib/utils.ts` (formatCardNumber, formatDate)

Renders: welcome PageHeader; 3 stat links (collection / points / achievements); two surface panels (recent cards with rarity+mutation badges; recent achievements); gold text links.

## /login
Entry: `app/(auth)/login/page.tsx`
- `components/ui/button.tsx` (twitch)
Centered `max-w-md` surface card: eyebrow, Fraunces title, muted copy, Twitch login.

## /collection
Entry: `app/(user)/collection/page.tsx`
- CollectionBrowser → CardFace, badges, button
PageHeader + grid of 3:4 slots.

## /admin/open/[id]
Entry: `app/(admin)/admin/open/[id]/page.tsx`
- BoosterOpenStage → BoosterPackPreview → BoosterPack3D; CardFace after open
PageHeader + centered pack + Open pack / Cancel.

## /admin/queue
Entry: `app/(admin)/admin/queue/page.tsx`
- PageHeader + table + Open link to `/admin/open/[id]`

## /reveal
Entry: `app/reveal/page.tsx`
- RevealStage (mystery then CardFace + badges)
