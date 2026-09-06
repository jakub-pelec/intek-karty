import { describe, expect, it } from "vitest";
import { toRoman } from "@/lib/ritual";

describe("toRoman", () => {
  it("converts collection numbers", () => {
    expect(toRoman(0)).toBe("N");
    expect(toRoman(12)).toBe("XII");
    expect(toRoman(37)).toBe("XXXVII");
  });
});
