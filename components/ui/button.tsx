import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "ritual-ember inline-flex items-center justify-center gap-2 rounded-none font-[family-name:var(--font-cinzel)] text-[13px] font-medium tracking-[0.24em] uppercase disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4b36a]",
  {
    variants: {
      variant: {
        primary:
          "ritual-ember-solid border border-[#d4b36a] bg-[#d4b36a] text-[#1a1404] hover:border-[#e8cf8a] hover:bg-[#e8cf8a] hover:text-[#1a1404] hover:shadow-[0_0_18px_rgba(212,179,106,0.4)]",
        secondary:
          "border border-[#d4b36a]/35 bg-transparent text-[#d7d3c8] hover:border-[#e8cf8a] hover:text-[#e8cf8a] hover:shadow-[0_0_16px_rgba(212,179,106,0.28)]",
        ghost:
          "text-[#d7d3c8] hover:bg-transparent hover:text-[#e8cf8a] hover:[text-shadow:0_0_10px_rgba(212,179,106,0.45)]",
        danger:
          "border border-[#8b2e3a]/70 bg-[#1a0a0c] text-[#ffb4c0] hover:border-[#c45a68] hover:text-[#ffd0d6] hover:shadow-[0_0_16px_rgba(196,90,104,0.35)]",
        twitch:
          "bg-[#9146ff] text-white hover:bg-[#a970ff] hover:text-white hover:shadow-[0_0_18px_rgba(145,70,255,0.4)]",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-5 text-xs",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
