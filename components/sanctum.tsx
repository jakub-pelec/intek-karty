import type { HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SanctumCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border border-[#d4b36a]/30 bg-[#0c0b12] px-6 py-5", className)}
      {...props}
    />
  );
}

export function SanctumSection({
  title,
  children,
  className,
  rule = true,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  rule?: boolean;
}) {
  return (
    <section className={cn("relative", className)}>
      {rule ? (
        <div className="absolute -top-1 right-0 left-0 h-px bg-gradient-to-r from-transparent via-[#d4b36a]/30 to-transparent" />
      ) : null}
      <h2 className="mb-6 pt-4 text-center font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.3em] text-[#d4b36a]/80 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SanctumEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="py-8 text-center font-[family-name:var(--font-cormorant)] text-lg text-[#d7d3c8]/50 italic">
      {children}
    </p>
  );
}

export function SanctumPager({
  prevHref,
  nextHref,
}: {
  prevHref?: string | null;
  nextHref?: string | null;
}) {
  if (!prevHref && !nextHref) return null;
  return (
    <div className="mt-10 flex justify-center gap-10">
      {prevHref ? (
        <Link
          href={prevHref}
          className="font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.2em] text-[#d7d3c8] uppercase hover:text-[#d4b36a]"
        >
          Previous
        </Link>
      ) : null}
      {nextHref ? (
        <Link
          href={nextHref}
          className="font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.2em] text-[#d7d3c8] uppercase hover:text-[#d4b36a]"
        >
          Next
        </Link>
      ) : null}
    </div>
  );
}
