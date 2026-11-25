import type { Rule, VoiceProfile } from "@/lib/schema";

// ChatGPT custom-instructions field limit at time of writing. Re-check before claiming support.
export const CUSTOM_INSTRUCTIONS_LIMIT = 1500;

const rank = (r: Rule) => (r.status === "inferred" ? 1 : 0);

export function renderCustomInstructions(profile: VoiceProfile, limit = CUSTOM_INSTRUCTIONS_LIMIT): string {
  // Approved/edited first (stable sort), low-confidence dropped.
  const rules = profile.rules
    .filter((r) => r.confidence !== "low")
    .map((r, i) => ({ r, i }))
    .sort((a, b) => rank(a.r) - rank(b.r) || a.i - b.i)
    .map(({ r }) => r);
  let examples = profile.examples.slice(0, 3);

  const build = (rs: Rule[], exs: typeof examples) => {
    const style = rs.filter((r) => r.category !== "avoid");
    const avoid = rs.filter((r) => r.category === "avoid");
    const lines = [`How I write: ${profile.summary}`];
    if (style.length) lines.push("", "Style:", ...style.map((r) => `- ${r.context === "general" ? "" : `(${r.context}) `}${r.rule}`));
    if (avoid.length) lines.push("", "Avoid:", ...avoid.map((r) => `- ${r.rule}`));
    if (exs.length) lines.push("", "Examples of my writing:", ...exs.map((e) => `"${e.text}"`));
    lines.push("", "Always:", ...profile.guardrails.map((g) => `- ${g}`));
    return lines.join("\n");
  };

  let kept = rules;
  let out = build(kept, examples);
  while (out.length > limit && examples.length) out = build(kept, (examples = examples.slice(0, -1)));
  while (out.length > limit && kept.length) out = build((kept = kept.slice(0, -1)), examples);
  return out;
}
