# Extractable components

## AppShell
- Source: `components/app-shell.tsx`
- Category: layout
- Description: Full-height sidebar shell with viewer tabs, admin subtabs, user footer
- Extractable props: `activeItem` (string, default: "dashboard"), `showAdmin` (boolean, default: true), `userName` (string, default: "P40_Peleee"), `pointsBalance` (string, default: "42")
- Hardcoded: “Intek Binder” wordmark (no logo file), nav labels, Lucide icons, gold/night CSS

## PageHeader
- Source: `components/ui/panel.tsx`
- Category: basic
- Description: Fraunces page title + muted subtitle
- Extractable props: none required for drafts (hardcode titles)
- Hardcoded: type scale, tracking

Skip extracting Button, Badge, Input (inline in drafts).
