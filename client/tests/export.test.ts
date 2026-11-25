import { describe, expect, it } from "vitest";
import { renderSkillMd } from "@/lib/export/skill-md";
import { renderCustomInstructions } from "@/lib/export/custom-instructions";
import { handProfile } from "./fixtures";

describe("renderSkillMd", () => {
  it("matches snapshot", () => expect(renderSkillMd(handProfile, "Sam")).toMatchSnapshot());
  it("has no em dashes", () => expect(renderSkillMd(handProfile, "Sam")).not.toContain("—"));
});

describe("renderCustomInstructions", () => {
  it("matches snapshot", () => expect(renderCustomInstructions(handProfile)).toMatchSnapshot());

  it("drops low-confidence rules and puts approved/edited first", () => {
    const out = renderCustomInstructions(handProfile);
    expect(out).not.toContain("self-deprecating");
    expect(out.indexOf("Lead with the reason")).toBeLessThan(out.indexOf("under five sentences"));
  });

  it("trims examples then rules to fit the limit", () => {
    const out = renderCustomInstructions(handProfile, 400);
    expect(out.length).toBeLessThanOrEqual(400);
    expect(out).not.toContain("Examples of my writing");
  });
});
