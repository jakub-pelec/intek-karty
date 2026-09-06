# Intek Binder — design system (shipped ritual)

## Product
Twitch stream collectible binder. Viewers log in with Twitch, collect cards, chase holo/signed, earn titles, spend echoes in the shop. Streamer opens packs from Inner Sanctum.

Wordmark is the text **Intek Binder** (Cinzel, letterspaced). No pictorial logo. Do not invent a mark.

## Color
- Abyss page: `#05040a`
- Moon silver body: `#d7d3c8`
- Bone: `#cfc6b4` / `#f3efe6`
- Surface panels: `#0c0b12`
- Relic gold: `#d4b36a` (hairline borders, filled buttons, progress, active nav)
- Bestowed green: `#7dbe72` (completed titles: bar, count, Bestowed label, row wash `bg-[#7dbe72]/10`)
- Holo rarity label on Altar: `#00e5ff`
- Danger: `#8b2e3a` / `#1a0a0c`

## Type
- Display / titles / card names: Cormorant Garamond italic
- Wordmark + UI labels: Cinzel, wide tracking, uppercase
- Body: Cormorant light / Georgia. No Inter, Fraunces, Geist, IBM Plex, Anton

## Shell (every logged-in page)
- Full-bleed abyss + faint indigo glow + star dust
- Header: Intek Binder left, `{name} · {echoes} · depart` right, max-w-5xl
- Centered word-nav: Altar · Collection · Titles · Offerings · Chronicle · (admin) Inner Sanctum
- On `/admin/*` a second gold-ruled sanctum nav: Queue · Users · Fulfillment · Draws · Dev
- Active nav is gold; idle is moon silver. No sidebar.

## Chrome
- Filled gold buttons (`#d4b36a` on `#1a1404` text) for primary actions
- List panels: `border border-[#d4b36a]/30 bg-[#0c0b12]`
- Collection table: wider `max-w-7xl` frame, `border-[#d4b36a]/25`, inner dim `bg-[#05040a]/45`, “Completed x/y” top-right
- Plinth stats: top gold hairline, three engraved captions
- Cards are portrait relics in a frame, not rounded SaaS cards

## Anti
SaaS sidebar, Inter dashboards, Riftbound/Riot/Arcane branding, hextech filigree invented over the current hairline ritual chrome.
