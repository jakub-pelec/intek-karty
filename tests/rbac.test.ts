import { describe, expect, it } from "vitest";
import { parseAdminTwitchIds } from "@/lib/utils";

describe("admin twitch id parsing", () => {
  it("splits and trims a comma-separated list", () => {
    expect(parseAdminTwitchIds(" 123 ,456,  ")).toEqual(["123", "456"]);
    expect(parseAdminTwitchIds("")).toEqual([]);
  });
});
