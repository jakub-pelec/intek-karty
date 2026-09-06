"use client";

import dynamic from "next/dynamic";
import type { OpenCard } from "@/components/booster-open-scene";
import type { OpenPhase } from "@/lib/open-fx";

const Pack = dynamic(
  () => import("@/components/booster-pack-3d").then((mod) => mod.BoosterPack3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[28rem] items-center justify-center text-sm text-[var(--muted)]">
        Loading pack…
      </div>
    ),
  },
);

const OpenScene = dynamic(
  () =>
    import("@/components/booster-open-scene").then((mod) => mod.BoosterOpenScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-80 w-full items-center justify-center text-sm text-[var(--muted)]">
        Loading pack…
      </div>
    ),
  },
);

export function BoosterPackPreview({
  name,
  frontImageUrl,
  backImageUrl,
}: {
  name: string;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
}) {
  return (
    <div>
      <Pack name={name} frontImageUrl={frontImageUrl} backImageUrl={backImageUrl} />
    </div>
  );
}

export function BoosterOpenPreview({
  name,
  frontImageUrl,
  backImageUrl,
  phase,
  card,
  fullscreen = false,
}: {
  name: string;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  phase: OpenPhase;
  card?: OpenCard | null;
  fullscreen?: boolean;
}) {
  return (
    <OpenScene
      name={name}
      frontImageUrl={frontImageUrl}
      backImageUrl={backImageUrl}
      phase={phase}
      card={card}
      fullscreen={fullscreen}
    />
  );
}
