import type { Rarity } from "@/db/schema";

const ROMAN: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function toRoman(value: number) {
  let rest = Math.max(0, Math.floor(value));
  if (rest === 0) return "N";
  let out = "";
  for (const [amount, numeral] of ROMAN) {
    while (rest >= amount) {
      out += numeral;
      rest -= amount;
    }
  }
  return out;
}

export const RARITY_GEM: Record<
  Rarity,
  { shape: "circle" | "triangle" | "square" | "pentagon" | "hex"; fill: string }
> = {
  common: { shape: "circle", fill: "#8a5a2b" },
  rare: { shape: "triangle", fill: "#b8c0c8" },
  epic: { shape: "square", fill: "#d4b36a" },
  legendary: { shape: "pentagon", fill: "#d4af37" },
  joker: { shape: "hex", fill: "#cfc6b4" },
};
