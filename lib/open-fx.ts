import type { Rarity } from "@/db/schema";

export type OpenPhase = "idle" | "charge" | "burst" | "reveal";

export const OPEN_TIMING = {
  chargeMs: 4100,
  burstMs: 1300,
  shakeMs: 2480,
} as const;

export function chargeTension(ageSec: number) {
  const chargeSec = OPEN_TIMING.chargeMs / 1000;
  const shakeSec = OPEN_TIMING.shakeMs / 1000;
  const progress = Math.min(1, Math.max(0, ageSec / chargeSec));
  const shrink = 1 - 0.13 * (progress * progress);
  const shakeAge = ageSec - (chargeSec - shakeSec);
  const t = shakeAge <= 0 ? 0 : Math.min(1, shakeAge / shakeSec);
  const shake = 0.7 * t * t;
  return { progress, shrink, shake };
}

export const RARITY_LIGHT: Record<Rarity, string> = {
  common: "#d7d3c8",
  rare: "#7ec8ff",
  epic: "#c084fc",
  legendary: "#ffd76a",
  joker: "#ff6b9d",
};

export const SEAL_LIGHT = "#ffe7a3";
export const HOLO_LIGHT = "#00e5ff";

export function openWashColor(phase: OpenPhase, rarity?: Rarity | null) {
  if ((phase === "burst" || phase === "reveal") && rarity) {
    return RARITY_LIGHT[rarity];
  }
  return SEAL_LIGHT;
}

export function nextOpenPhase(
  phase: OpenPhase,
  chargeElapsed: boolean,
  hasCard: boolean,
): OpenPhase | null {
  if (phase === "charge" && chargeElapsed && hasCard) return "burst";
  return null;
}

export function cardArtUrl(imageUrl: string | null | undefined, rarity: Rarity) {
  return imageUrl || `/cards/${rarity}.svg`;
}
