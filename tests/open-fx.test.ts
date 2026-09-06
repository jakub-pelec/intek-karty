import { describe, expect, it } from "vitest";
import {
  cardArtUrl,
  chargeTension,
  nextOpenPhase,
  OPEN_TIMING,
  openWashColor,
  RARITY_LIGHT,
  SEAL_LIGHT,
} from "@/lib/open-fx";
import { RARITIES } from "@/lib/constants";

describe("open sequence", () => {
  it("waits for both the charge and the drawn card before bursting", () => {
    expect(nextOpenPhase("charge", false, true)).toBeNull();
    expect(nextOpenPhase("charge", true, false)).toBeNull();
    expect(nextOpenPhase("idle", true, true)).toBeNull();
    expect(nextOpenPhase("charge", true, true)).toBe("burst");
  });

  it("holds a long charge, then a short shake, then the burst", () => {
    expect(OPEN_TIMING.chargeMs).toBeGreaterThanOrEqual(4000);
    expect(OPEN_TIMING.shakeMs).toBeLessThan(OPEN_TIMING.chargeMs);
    expect(OPEN_TIMING.burstMs).toBeGreaterThan(1000);

    const start = chargeTension(0);
    const mid = chargeTension(OPEN_TIMING.chargeMs / 2000);
    const beforeShake = chargeTension((OPEN_TIMING.chargeMs - OPEN_TIMING.shakeMs - 16) / 1000);
    const end = chargeTension(OPEN_TIMING.chargeMs / 1000);
    expect(start.shrink).toBe(1);
    expect(start.shake).toBe(0);
    expect(mid.shrink).toBeLessThan(start.shrink);
    expect(beforeShake.shake).toBe(0);
    expect(mid.shake).toBeGreaterThan(0);
    expect(end.shrink).toBeLessThan(mid.shrink);
    expect(end.shake).toBeCloseTo(0.7);
  });

  it("maps every rarity to a light color and a fallback art path", () => {
    for (const rarity of RARITIES) {
      expect(RARITY_LIGHT[rarity]).toMatch(/^#/);
      expect(cardArtUrl(null, rarity)).toBe(`/cards/${rarity}.svg`);
    }
    expect(cardArtUrl("/uploads/card.png", "epic")).toBe("/uploads/card.png");
  });

  it("keeps the wash on the seal until the card actually bursts", () => {
    expect(openWashColor("idle", "joker")).toBe(SEAL_LIGHT);
    expect(openWashColor("charge", "joker")).toBe(SEAL_LIGHT);
    expect(openWashColor("burst", null)).toBe(SEAL_LIGHT);
    expect(openWashColor("burst", "joker")).toBe(RARITY_LIGHT.joker);
    expect(openWashColor("reveal", "joker")).toBe(RARITY_LIGHT.joker);
  });
});
