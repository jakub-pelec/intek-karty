---
version: "superdesign-alpha"
name: "Portfolio White Ledger"
description: "A white-paper editorial gallery system with a single fixed near-black bar, edge-to-edge image tiles as the sole color carriers, and Work Sans headline weight against proxima-nova reading text."
colors:
  background: "#FFFFFF"
  surface: "#000321"
  text-primary: "#000000"
  text-secondary: "#BBBBBB"
  accent: "#253551"
typography:
  display-lg:
    fontFamily: "Work Sans"
    fontSize: "59px"
    fontWeight: 700
    lineHeight: "1.1"
  body-md:
    fontFamily: "proxima-nova"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "1.6"
  label-nav:
    fontFamily: "proxima-nova"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "1.6"
  accent-script:
    fontFamily: "Work Sans"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: "1.1"
spacing:
  base: "8px"
  gap: "17px"
  section-padding: "146px"
rounded:
  control: "6px"
  card: "6px"
  pill: "6px"
components:
  navbar-cta:
    background: "#000321"
    text-color: "#FFFFFF"
    radius: "6.4px"
    height: "31px"
    padding: "5.4784px 9.14893px"
  button-ghost:
    background: "transparent"
    text-color: "#000000"
    radius: "0px"
    height: "44px"
    padding: "8px"
    hover-opacity: "1"
  button-primary-hero:
    background: "#FFFFFF (observed near-white solid)"
    text-color: "#000000"
    radius: "6px (observed)"
    height: "44px (observed)"
  card-media-gallery:
    background: "transparent"
    radius: "0px"
    padding: "0px"
  card-full-panel-media:
    background: "transparent"
    radius: "0px"
    padding: "17px"
  card-full-panel-text:
    background: "transparent"
    radius: "0px"
    padding: "0px"
  card-heading-body:
    background: "transparent"
    radius: "0px"
    padding: "0px"
---
# Portfolio White Ledger
Source: https://www.eminguyen.com/riftbound

## Overview
This is a minimalist editorial-portfolio system: white page as the constant, a single fixed near-black navigation bar as the only persistent chrome, and all color/energy delivered exclusively through embedded photographic and illustrated media tiles. Typography carries the authorial voice — a bold Work Sans display face for headings and a hand-scripted wordmark in the nav — while proxima-nova handles all reading text at a restrained 16px. There is no card-chrome (no radius, no shadow, no border) anywhere outside the nav CTA; every visual event is bled full-bleed image content set directly against white or against the fixed dark bar.

## Composition
The first screen opens on a square, edge-to-edge dark bar holding a left-aligned text link and a centered script wordmark, immediately followed by a full-width three-panel image band (a hand holding foil packs, a diagonal tessellation of card art, a warm ochre-toned textured panel with a centered pack-mockup) that runs the entire viewport width with no gutters. Scrolling down, the page snaps into a strict contained column: a two-column header (large bold headline left, small role/company metadata right) under a thin ruled divider, then a three-up photo row, then long-form body copy paired with single large right-aligned card-art images, then a four-up rarity progression row (labelled COMMON/UNCOMMON/RARE/EPIC in bold caps above card art), repeated as an eight-card two-row block, then a return to full-bleed diagonal card-tessellation texture, then a closing two-up packaging-mockup pair on the ochre texture, then plain-text footer links, then the dark bar reappears as a base. The deliberate choice is alternating full-bleed image bands against a strictly contained 1800px text column — rejecting a uniform contained-everywhere layout — so imagery gets to breathe edge-to-edge while reading content stays measured and legible.

## Colors
White (#FFFFFF) is the dominant field, structural background for every text passage and the surrounding matte for all image tiles — it is not a neutral accent but the literal page substrate, consistent with the near-white pixel dominance seen throughout. The one declared UI color, a deep navy-black (#000321), is rationed to a single element: the fixed top bar and its embedded CTA — never repeated in body content. Text ink is pure black (#000000) for all reading copy and headings; a light gray (#BBBBBB) serves as secondary/muted tone inside the dark bar context. A slate-navy (#253551) exists as a token for sale/accent price-style text, held in reserve and not visible as a dominant hero color. All saturated color — amber/ochre, teal, magenta, gold-line illustration — lives strictly inside photographic and card-art media tiles; none of it touches the surrounding UI chrome, borders, or type.

## Typography
Work Sans 700 at 59px/1.1 sets section headlines in tight, heavy, sans display letterforms — bold and left-set against a thin ruled hairline beneath the header block. A lighter Work Sans instance forms the cursive-styled nav wordmark. Body copy runs in proxima-nova 400 at 16px/1.6, the reading workhorse for both long-form paragraphs and short metadata labels (role/company pairs), with italics used for a light inline aside within the intro paragraph. Bold caps (Work Sans) label the rarity-tier headers above the card grids. Hierarchy is strictly two-tier: an oversized bold display face for headings, and a single small reading size for everything else — no intermediate subhead scale.

## Layout
Content is capped at an 1800px max-width, centered, with a 146px vertical section rhythm between major bands and an 8px/16px/17px micro-spacing scale governing card gutters and inline gaps. The navbar is a full 100%-viewport-width square bar (0px radius on all four corners), 146px tall, static/non-collapsing. Card grids are uniform single-row stacks at 100–102% container width per item — not multi-column bento — reading as stacked full-width panels rather than a packed grid; the only true multi-up arrangement is the four-across rarity-tier rows (repeated twice, 4+4), which qualifies as a uniform card grid, not masonry or bento. Full-bleed photo/texture bands break the contained column entirely, spanning true edge-to-edge.

## Components
- **Navbar**: edge-to-edge square bar, 1920px wide (100% viewport, 0px inset both sides), 146px tall, all four corners 0px radius, static position, fill `#000321`; holds 8 total items (a left text link plus a centered script wordmark treatment); its CTA is `#000321` fill, `#FFFFFF` text, 6.4px radius, 31px height, padding `5.4784px 9.14893px`.
- **Button — ghost/link (body)**: transparent fill, `#000000` text, 0px radius (sharp), 44px height, 8px padding; used for inline text-link actions in body copy and footer; hover moves opacity to 1, implying a resting dimmed state.
- **Button — hero primary (observed)**: a near-white/cream solid pill-to-rectangle sitting under hero-adjacent copy, observed ~6px corner radius, ~44px height, black text — the single highest-contrast control on the page; do not substitute the navbar CTA's navy fill or 6.4px/31px spec here.
- **Media gallery card family (×8, in the top full-bleed band)**: transparent fill, 0px radius, 0px padding, media-top-bleed anatomy — each tile is pure image with no text overlay, arranged as an unbroken horizontal filmstrip across the full viewport.
- **Full-width panel + media-top card family (×4, mid-page)**: transparent fill, 0px radius, 17px padding, rows of [100 | 100 | 100 | 100] — single-column stacked panels, each pairing an image block over supporting text, used for the rarity/frame-progression narrative.
- **Full-width panel + body-text card family (×4, mid-page)**: transparent fill, 0px radius, 0px padding, rows [100 | 100 | 100 | 100] — pure text panels stacked full-width, carrying the long-form process narrative between image bands.
- **Media-top card family (×2, near page end)**: transparent fill, 0px radius, 0px padding — the closing packaging-mockup pair, image-only tiles set against the ochre-textured full-bleed background.
- **Full-width panel + heading + body-text card family (×2, mid-page)**: transparent fill, 0px radius, 0px padding, rows [102 | 102] — heading-led text blocks (the bold caps rarity labels plus supporting line) slightly overflowing container width.
- **Media-top card family (×2, mid-page, second instance)**: transparent fill, 0px radius, 0px padding — a secondary paired-image block distinct from the closing pair, used mid-narrative.
- **Padded stacked card family (×2, mid-page)**: transparent fill, 0px radius, 17px padding, rows [100 | 100] — full-width stacked blocks with inset padding, distinct from the zero-padding text panels.
- **Footer**: transparent background, 0 hyperlinked nav items in the conventional sense — presented instead as inline plain-text pipe-separated links directly above the closing dark bar.

## Graphics & Effects
No gradients are declared in code; all color drama is photographic — a warm ochre/ash textured backdrop (visible grain, almost fabric-like) behind the packaging mockups, and saturated card-illustration art (teal, magenta, crimson, gold linework) confined entirely within image tiles. The ochre panels carry a visible fine-grain/noise texture reading as a paper or stone surface scan, not a flat fill. Card art itself uses gold hairline frame ornamentation (visible in the mockup tiles) as a decorative border motif on the images, not on any UI chrome. No blur, glass, or shadow elevation is used anywhere — every surface is flat and edge-square; depth is implied only by photographic perspective (angled packaging shots) rather than by CSS elevation.

## Motion
Transitions are restrained and utilitarian: a slow 0.9s `ease` opacity fade and a 0.6s `cubic-bezier(0.4, 0, 0.2, 1)` opacity fade govern content and image reveals; a snappier 0.25s `cubic-bezier(0.2, 0.6, 0.3, 1)` pairing drives transform/width changes (likely carousel-arrow or hover-state shifts on the top gallery); a 0.6s `cubic-bezier(0.4, 0, 0.2, 1)` transform handles larger positional moves. A font-loading keyframe indicates a FOUT-guarded type swap on load. Overall motion character is unhurried and editorial — fades dominate over slides or scales, reinforcing the print-gallery feel rather than an app-like snappiness.

## Guardrails
- Never tint the white page background or add a colored surface layer outside the fixed navy bar and embedded media — color belongs to images only.
- Never round any card, panel, or text-block corner; 0px is absolute except the 6.4px navbar CTA and observed hero primary.
- Never turn the fixed square 146px navbar into an inset, floating, or capsule bar — it is edge-to-edge with hard right-angle corners.
- Never substitute the navy `#000321`/31px navbar CTA spec for the hero's primary button — they are different components with different fills and sizes.
- Never introduce shadows, blur, or glass panels — elevation and depth come only from photographic content, never from CSS effects.
- Never compress the multi-row full-width card stacks into a multi-column grid — each measured family is a single-column, full-width repeating stack.