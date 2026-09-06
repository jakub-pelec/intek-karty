import type { HTMLAttributes, ReactNode } from "react";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { cn } from "@/lib/utils";

export function Panel({
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

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <RitualPageHeader title={title} eyebrow={subtitle}>
      {children}
    </RitualPageHeader>
  );
}
