# Theme — compact token summary

## Colors (`:root`)
- `--background`: `#0c0a12`
- `--foreground`: `#f3efe6`
- `--muted`: `#9a93a8`
- `--surface`: `#16131f`
- `--surface-2`: `#211c2d`
- `--surface-3`: `#2c263c`
- `--border`: `#342e44`
- `--accent`: `#d4b15f`
- `--accent-hover`: `#e3c57a`

## Rarity
- common: bg `#2a3140` / text `#c5cedb`
- rare: bg `#12365c` / text `#7ec2ff`
- epic: bg `#3a1d5c` / text `#d2a6ff`
- legendary: bg `#4a3810` / text `#f5c542`
- joker: bg `#4a1530` / text `#ff7eac`
- holo badge: bg `#123a3a` / text `#7ef0e0`
- signed badge: bg `#3a2412` / text `#f0c27e`

## Type
- UI: Geist (`--font-geist-sans`), system-ui fallback
- Display: Fraunces (`--font-display`), wide tracking on titles
- Body: cream `#f3efe6` on night `#0c0a12`

## Shape
- Controls: `rounded-lg`
- Panels / cards: `rounded-xl`
- Login card: `rounded-2xl`
- Sidebar: 16rem (`w-64`), full `h-dvh`

## Motion (existing)
- Holo foil sweep 5.5s + sheen 2.8s on signed/holo card faces
- Idle 3D pack: slow Y yaw + small float (Three.js)
- Sidebar slide on mobile

## Raw `app/globals.css`
See repository file `app/globals.css` (under 100 lines). No `tailwind.config`; Tailwind v4 via `@import "tailwindcss"` and `@theme inline`.
