import { describe, expect, it } from "vitest";
import { baselineSystem } from "@/lib/generate/baseline";
import { personalizedSystem } from "@/lib/generate/personalized";
import { editDistance, sendAsIsRate, winRate } from "@/lib/metrics";
import { handProfile } from "./fixtures";

describe("generation prompts", () => {
  it("personalized = baseline + profile block, nothing else", () => {
    const p = personalizedSystem(handProfile);
    expect(p.startsWith(baselineSystem())).toBe(true);
    expect(p).toContain("<voice_profile>");
    expect(p).toContain("Lead with the reason for reaching out.");
  });
});

describe("editDistance", () => {
  it("is 0 for identical text", () => expect(editDistance("Hi Sam,", "Hi Sam,")).toBe(0));
  it("counts inserted and removed characters", () => {
    expect(editDistance("Hi Sam", "Hi Sam!")).toBe(1);
    expect(editDistance("Hello there", "Hi there")).toBe("ello".length + "i".length);
  });
});

describe("rates", () => {
  const rows = [
    { picked: "profile", sendAsIs: true },
    { picked: "profile", sendAsIs: false },
    { picked: "baseline", sendAsIs: null },
    { picked: null, sendAsIs: null },
  ] as const;
  it("win rate ignores undecided comparisons", () => expect(winRate([...rows])).toBeCloseTo(2 / 3));
  it("send-as-is rate counts answered picks only", () => expect(sendAsIsRate([...rows])).toBe(0.5));
  it("returns null with no data", () => expect(winRate([])).toBeNull());
});
