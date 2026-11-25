import type { Context, Rule, VoiceProfile } from "@/lib/schema";

const SECTIONS: [Context, string][] = [
  ["general", "General style"],
  ["outreach", "Outreach"],
  ["application", "Applications"],
  ["casual", "Casual"],
  ["technical", "Technical"],
];

const bullets = (rules: Rule[]) => rules.map((r) => `- ${r.rule}`).join("\n");

export function renderSkillMd(profile: VoiceProfile, name: string): string {
  const style = profile.rules.filter((r) => r.category !== "avoid");
  const avoid = profile.rules.filter((r) => r.category === "avoid");

  const parts = [
    "---",
    "name: personal-voice",
    `description: Write in ${name}'s approved communication style for emails, messages and other writing tasks.`,
    "---",
    "",
    `# How ${name} writes`,
    profile.summary,
  ];

  for (const [ctx, title] of SECTIONS) {
    const rules = style.filter((r) => r.context === ctx);
    if (rules.length) parts.push("", `# ${title}`, bullets(rules));
  }
  if (avoid.length) parts.push("", "# Avoid", bullets(avoid));

  const examples = profile.examples.slice(0, 3);
  if (examples.length) {
    parts.push("", "# Examples");
    for (const ex of examples) parts.push("", `${ex.context}:`, "```", ex.text, "```");
  }

  parts.push("", "# Guardrails", profile.guardrails.map((g) => `- ${g}`).join("\n"), "");
  return parts.join("\n");
}
