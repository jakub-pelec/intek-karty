# Shared UI primitives

## Button — `components/ui/button.tsx`

```tsx
import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
  {
    variants: {
      variant: {
        primary: "bg-[var(--accent)] text-[#1a1404] hover:bg-[var(--accent-hover)]",
        secondary: "bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--surface-3)]",
        ghost: "hover:bg-[var(--surface-2)] text-[var(--foreground)]",
        danger: "bg-[#8b2e3a] text-white hover:bg-[#a53b49]",
        twitch: "bg-[#9146ff] text-white hover:bg-[#772ce8]",
      },
      size: { sm: "h-8 px-3", md: "h-10 px-4", lg: "h-12 px-5 text-base" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({ className, variant, size, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

## Badge — `components/ui/badge.tsx`

```tsx
const rarityClass = {
  common: "bg-[#2a3140] text-[#c5cedb]",
  rare: "bg-[#12365c] text-[#7ec2ff]",
  epic: "bg-[#3a1d5c] text-[#d2a6ff]",
  legendary: "bg-[#4a3810] text-[#f5c542]",
  joker: "bg-[#4a1530] text-[#ff7eac]",
};
// Badge: rounded-full px-2 py-0.5 text-xs
// MutationBadges: Holo #7ef0e0 / Signed #f0c27e
// RarityBadge uses rarityClass
```

Full file: `components/ui/badge.tsx`.

## Input — `components/ui/input.tsx`
`h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]`. Label uppercase muted xs.

## Panel / PageHeader — `components/ui/panel.tsx`
Panel: `rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4`.
PageHeader: Fraunces `text-3xl tracking-wide` + muted subtitle.
