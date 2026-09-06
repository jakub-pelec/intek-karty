# Layouts

## Root — `app/layout.tsx`
`html` + `body` `min-h-dvh`. Fonts: Geist (`--font-geist-sans`), Fraunces (`--font-display`).

## Viewer — `app/(user)/layout.tsx`
`requireUser()` then `<AppShell user={user}>{children}</AppShell>`.

## Admin — `app/(admin)/layout.tsx`
`requireAdmin()` then same `AppShell`.

## Reveal — `app/reveal/layout.tsx`
Transparent OBS chrome, no AppShell.

## AppShell — `components/app-shell.tsx`
Fixed left sidebar `w-64` `h-dvh` `bg-[var(--surface)]` `border-r`. Wordmark “Intek Binder” (Fraunces, no logo image). Nav groups: Collection (Dashboard, Collection, Achievements, Shop, History). Admin: Staff / Admin panel + subtabs (Queue, Users, Cards, Boosters, Achievements, Rewards, Draws, Dev). Footer: avatar, name, gold points, Log out. Main: `lg:pl-64`, content `max-w-6xl px-4 py-6`. Mobile: hamburger + overlay + top bar.

Full source: `components/app-shell.tsx` (263 lines).
