# Intek Binder — design system

## Product (locked)
Twitch stream collectible binder for Intek (Peleee). Viewers log in with Twitch, redeem Channel Points for boosters, streamer opens packs live. In-app collector points are separate. Jobs: watch, collect 37 cards, chase holo/signature, redeem shop rewards, open packs on air.

Wordmark is the text **Intek Binder**. No pictorial logo. Do not invent a mark. Do not use Riot, Riftbound, Arcane, or League wordmarks or champion art.

## Chosen direction
**Void Altar + Riftbound card craft.** Keep the hush of the Void Altar: abyss field, moon-silver type, one relic on a plinth, lots of night. Align every chrome piece with Riftbound-style card frames — hextech filigree, energy lines, notched double-borders, metal rarity, a gem at the foot of the card.

This is inspiration, not a clone. Intek cards stay Intek. No League champions on the page.

## Color
- Abyss: `#05040a`
- Moon silver: `#d7d3c8`
- Bone: `#cfc6b4`
- Far indigo mist only in depth: `#1a1630`
- Frame metals: bronze `#8a5a2b`, silver `#b8c0c8`, relic gold `#d4b36a` (filigree and gems only, not SaaS fill buttons)
- Holo energy: cyan-teal along filigree, never a page wash
- Twitch purple `#9146ff` only on login

## Type
- Display / greeting / card name: Cormorant Garamond (italic for the relic name)
- Wordmark: Cinzel, letterspaced, small like a carved lintel — not Beaufort, not Inter
- UI labels: Cinzel or Cormorant small caps. No IBM Plex Mono, Anton, Geist, Fraunces, Inter

## Card language (from Riftbound frames)
- Portrait relic, art-first. Hextech-like filigree around the edge — seamless energy lines, not a rounded-xl CSS card.
- Notched / stepped corners like the Arcane×Riftbound box frame (inward notches at corners and mid-sides), gold double-stroke.
- Rarity gem at the bottom center:
  - common: bronze + circle
  - rare: silver + triangle
  - epic: gold + square
  - legendary: foil gold + pentagon
  - joker: hex gem
- Holo = foil sheen on the filigree. Signed = a small inked signature on the art, not a candy pill.
- UI chrome (nav rules, plinth, stat captions) uses the same notched hairline and metal — the page is one ritual object, not a dashboard around a card.

## Layout
Keep Void Altar: centered vertical axis, extreme negative space, quiet top word-nav, stats as engraved captions under the plinth, memorial lists in the lower third. Do not return to a SaaS sidebar or three metric tiles.

## Anti
Tech HUD, program clocks, amber ticks, glass, mesh blobs, Inter luxury dashboards, Riot/Arcane/Riftbound branding, copied champion illustrations as product content.
