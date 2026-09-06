"use client";

import dynamic from "next/dynamic";
import { CanvasFallback } from "@/components/canvas-fallback";
import type { CardInspectProps } from "@/components/card-inspect-canvas";
import { cn } from "@/lib/utils";

const CardInspectCanvas = dynamic(
  () =>
    import("@/components/card-inspect-canvas").then((mod) => mod.CardInspectCanvas),
  {
    ssr: false,
    loading: () => <CanvasFallback />,
  },
);

export function CardInspect({
  className,
  name,
  holographic = false,
  signature = false,
  ...props
}: CardInspectProps) {
  return (
    <div
      className={cn(
        "relative aspect-[63/88] h-full w-full min-h-0 touch-none",
        className,
      )}
      role="img"
      aria-label={[holographic && "holographic", signature && "signed", name]
        .filter(Boolean)
        .join(" ")}
    >
      <CardInspectCanvas name={name} holographic={holographic} {...props} />
    </div>
  );
}
