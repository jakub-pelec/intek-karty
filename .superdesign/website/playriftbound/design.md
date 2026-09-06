---
version: "superdesign-alpha"
name: "Deep Teal Rift"
description: "Deep-teal editorial dark mode with a sharp-cornered orange/white button pair, illustrated card assets, and a heavy display serif reserved for identity marks."
colors:
  background: "#013951"
  surface: "#1E3043"
  text-primary: "#FFFFFF"
  text-secondary: "#7E7E7E"
  accent: "#EF7D00"
  accent-cyan: "#37CD8F"
  ink-dark: "#141212"
typography:
  display-lg:
    fontFamily: "Beaufort for LOL"
    fontSize: "20px"
    fontWeight: 900
    lineHeight: "1.4"
  headline-md:
    fontFamily: "Beaufort for LOL"
    fontSize: "32px"
    fontWeight: 900
    lineHeight: "1.25"
  body-md:
    fontFamily: "Inter"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "1.2"
  label-mono:
    fontFamily: "Inter"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "1.2"
  accent-utility:
    fontFamily: "Helvetica"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "1.4"
spacing:
  base: "8px"
  gap: "32px"
  section-padding: "48px"
rounded:
  control: "4px"
  card: "4px"
  pill: "12px"
components:
  button-utility:
    background: "#F0F0F0"
    text-color: "#141212"
    radius: "4px"
    height: "34px"
    border: "1px solid rgb(255, 255, 255)"
    hover-background: "#DCDCDC"
  button-primary:
    background: "#EF7D00"
    text-color: "#1E3043"
    radius: "0px"
    height: "64px"
    hover-background: "#F29733"
  button-secondary:
    background: "#FFFFFF"
    text-color: "#1E3043"
    radius: "0px"
    height: "64px"
    hover-background: "#CCCCCC"
  button-gradient-accent:
    background: "linear-gradient(315deg, rgb(11, 196, 226) 0%, rgb(44, 140, 194) 100%)"
    text-color: "#111111"
    radius: "12px"
    height: "48px"
  card-media-bleed:
    background: "transparent"
    radius: "0px"
    padding: "0px"
  card-cta-band:
    background: "#EF7D00"
    radius: "0px"
    padding: "18px 32px"
---
# Deep Teal Rift
Source: https://playriftbound.com/en-us/

## Overview
This is a dark-mode-default editorial system built on a single deep petrol-teal field rather than near-black — the page's dominant pixel value sits at `#003048`-family teal, not gray or black, giving the whole system a submerged, aquatic cast. Identity is carried by a heavyweight condensed display serif (Beaufort for LOL) reserved exclusively for wordmarks and section titles, paired against a workmanlike compact grotesque for all running copy. Corners are almost universally sharp: buttons, cards, and media are 0–4px, giving the system a printed, poster-like squareness that contrasts against the softness of the illustrated card art and photography it frames. Orange is the only saturated hue in the system and it is rationed to calls-to-action alone.

## Composition
The first screen is a full-bleed desaturated photographic hero scrimmed toward teal, carrying a centered lockup (a stylized display wordmark in orange-over-white) above a two-line all-caps statement line, above a horizontal pair of rectangular buttons. Below the fold the page shifts to flat teal panels in a strict top-to-bottom rhythm: an intro statement band, a product/asset showcase row, a second CTA-and-asset row, a three-up illustrated feature strip with caption lines, a featured-content row, then a compact dark footer. Density is low-to-moderate — generous 32px+ gaps separate every row, and each band centers its text before introducing imagery. The deliberate choice is a photographic, human hero over an abstract gradient or 3D-render hero; this trades graphic punch for a documentary, in-the-world tone, at the cost of a bolder first-screen color statement.

## Colors
Background/surface is a single flat teal, `#013951` (declared area 47.2%, and the dominant sampled pixel value at ~73% including its `#003048` variant) — this is the page's true resting color, used edge-to-edge across every content band, not just the hero. Near-black (`#111111`, ~3.5% area) appears only at the very top navbar and the footer, bookending the teal field. Orange `#EF7D00` is the sole accent and is rationed to under 1% of pixel area: it lands only on primary buttons and one CTA card pair — never on backgrounds, text, or decorative fills. White (`#FFFFFF`) carries all primary text and the secondary button fill. A muted gray secondary text tone (`#7E7E7E`) is reserved for supporting copy. A cyan-to-blue gradient (`rgb(11,196,226)`→`rgb(44,140,194)`) appears once as a distinct pill-shaped accent button — likely a utility/consent action — and should not be read as a hero or section background. Nothing in the mid-page bands introduces new hues: illustrated card assets carry their own internal saturated palette (purples, greens) but the surrounding chrome stays disciplined teal/white/orange.

## Typography
Beaufort for LOL, a heavy 900-weight condensed serif, is used exclusively for the wordmark and any large section title (e.g., the product-line heading) at 32px/900/1.25 — never for body copy. All running text — statement lines, card captions, news excerpts — sits in TT Norms Pro Compact at 16px/400 in white, with secondary/meta text (dates, categories) dropping to the muted `#7E7E7E` tone in a smaller all-caps label face. Inter at 13px/600 handles compact UI labels (nav items, button text) in tight, uppercase-tracked sets. The hierarchy is binary and confident: an oversized serif identity mark, then uniform sans body — no intermediate weight tiers.

## Layout
Content is capped at a 1600px max-width, centered, with a consistent 48px section padding and a 32px inter-item gap. The core repeating unit is a 3-column card row (product line: booster pack / booster box / champion decks; feature strip: three captioned illustrated pairs; featured news: three story tiles) — every one of these observed rows is a uniform [3] composition, no wide-spanning cards, making this a plain uniform card grid rather than bento or masonry. One 2-column band (declared grid: 2 columns, gap 32px, row split ~46/46) appears for a paired CTA-button layout, confirming an even, non-asymmetric split. Media in every card is a full-bleed top image with zero card padding and zero corner radius, text sitting below in a separate padded block — a hard media/text split rather than an overlaid or inset composition.

## Components
- **Navbar**: edge-to-edge full-width bar, near-black (`#111111`-family), fixed height ~64px, sharp corners (no radius, standard rectangular bar spanning the viewport). Contains a logo lockup at far left (two marks side by side), 6 nav items (a dropdown item plus five plain links) at a compact uppercase label size, a globe/locale icon, and a rounded capsule "sign in" CTA in a light cyan/blue fill at far right — this capsule is the nav's only rounded element against an otherwise square bar.
- **Hero primary button**: an observed near-white/orange solid rectangle, ~0px corners (sharp), sitting left of a paired button under the headline — filled orange `#EF7D00` with dark-teal `#1E3043` text, 64px tall, 18px/32px padding; hovers to a lighter orange `#F29733`. This is the single most emphasized control on the first screen.
- **Hero secondary button**: paired beside the primary, solid white fill, same 0px-radius rectangle, same 64px height and padding, dark-teal text; hovers to light gray `#CCCCCC`. Lower visual weight than the orange primary despite identical geometry, by virtue of being the achromatic option.
- **Utility button (small)**: light gray `#F0F0F0` fill, dark `#141212` text, 4px radius (slightly-rounded), compact 34px height, thin white 1px border; hovers to `#DCDCDC`. Used for smaller in-page actions (e.g., consent/cookie controls), not the hero.
- **Gradient capsule button**: transparent-mount pill with the verbatim fill `linear-gradient(315deg, rgb(11, 196, 226) 0%, rgb(44, 140, 194) 100%)`, dark `#111111` text, 12px radius, 48px height — the system's only rounded, gradient-filled control; reads as a nav or consent utility, not a page CTA.
- **Product/media card** (×3 per row, uniform grid): transparent background, 0px radius, 0px padding. Anatomy top-to-bottom: full-bleed illustrated packaging photograph filling the top ~70% of the card, a bold white title beneath, then a 1–2 line gray-white descriptive caption. No borders, no chips, no numerals.
- **Feature-pair card** (×3 per row): transparent, 0px radius. Anatomy: two overlapping illustrated trading-card images angled/fanned as the top media block, followed by a centered one-line caption in white beneath. No CTA inside the card itself.
- **Featured-news card** (×3 per row): transparent, 0px radius, 0px padding. Anatomy: full-bleed illustrated/photographic thumbnail with a small square share/link icon chip in its bottom-right corner, then below the image an uppercase category label + date line in muted gray, a bold white headline, then a 1–2 line gray body excerpt.
- **CTA band pair** (×2, side-by-side): solid `#EF7D00` fill, 0px radius, 18px/32px padding — same geometry family as the hero buttons, repeated mid-page as a secondary conversion prompt paired with a white counterpart button.
- **Footer**: transparent/near-black band, no visible link list beyond legal text and icon row; contains a horizontal row of circular social icons, two small logo marks, a centered legal/copyright line, and a trailing row of three plain-text legal links. No card content, no columns of links — minimal and text-centered.

## Graphics & Effects
The hero photograph carries a bottom-anchored scrim, verbatim `linear-gradient(to top, rgb(1, 57, 81) 0%, rgba(0, 0, 0, 0) 100%)`, rising from the image's base to fully transparent partway up — this is applied only to the hero media element, covering roughly its lower half, not the full viewport; it is what pulls the photograph into the page's teal identity. A second, near-identical dark gradient (`linear-gradient(rgb(20, 18, 18) 40px, rgba(0, 0, 0, 0) 100%)`) sits as a small top-edge fade on a modal or panel element, not a background. The cyan gradient button fill is confined strictly to that one small pill control. A soft ambient shadow (`rgba(0, 0, 0, 0.2) 0px 4px 16px 0px`) lifts floating UI elements such as menus or the sign-in capsule; a tight light-gray glow (`rgb(204, 204, 204) 0px 0px 2px 2px`) rings small interactive chips, likely icon buttons on news cards. A background video surface likely drives the hero motion layer in production; for a static rebuild, substitute the photographic hero frame with its teal scrim baked in.

## Motion
Interactive color transitions are slow and eased: text/border color shifts run `0.5s`–`1s` on a custom deceleration curve `cubic-bezier(0.06, 0.81, 0, 0.98)`, giving hovers a gradual, non-snappy settle rather than an instant flip. Background-color transitions on buttons are quicker, `0.2s ease-out` to `0.25s`/`0.3s ease-in-out`, so fills change faster than text/border accents — a layered hover where color lags fill. Treat all state changes as smooth fades, never abrupt swaps or scale/spring effects; no bounce or overshoot easing is present anywhere in the system.

## Guardrails
- Never let the teal field slip toward black or gray — the background is a specific deep petrol teal (`#013951`), not a neutral dark surface.
- Do not round the primary/secondary hero buttons or the CTA-band buttons — they are strictly 0px rectangular; reserve rounding (4px, 12px, and the nav capsule) for smaller utility controls only.
- Keep orange under 1% of visible area — it belongs on buttons only, never as a background wash, text color at scale, or card fill.
- Reserve Beaufort for LOL for identity/title moments only; body and captions stay in the compact grotesque.
- Do not fill card interiors with panel backgrounds or borders — every card family here is transparent with 0px radius and 0px padding, media bleeding directly to edge.
- Keep the hero as a scrimmed photograph, not an abstract gradient field — the measured teal gradient is a bottom scrim on the image, not a standalone hero background.