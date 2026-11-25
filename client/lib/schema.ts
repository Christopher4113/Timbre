import { z } from "zod";

export const Context = z.enum(["general", "outreach", "application", "casual", "technical"]);
export type Context = z.infer<typeof Context>;

export const Rule = z.object({
  id: z.string(),
  category: z.enum([
    "vocabulary", "sentence_structure", "polish", "punctuation", "formatting",
    "length", "openers_closers", "directness", "humor", "explanation",
    "storytelling", "persuasion", "avoid",
  ]),
  context: Context,
  rule: z.string().min(5), // imperative: "Lead with the reason for reaching out."
  source: z.enum(["speech", "writing", "both"]),
  evidence: z.array(z.string()).min(1), // short verbatim quotes from the user's own data
  confidence: z.enum(["low", "medium", "high"]),
  status: z.enum(["inferred", "approved", "edited"]),
});
export type Rule = z.infer<typeof Rule>;

export const VoiceProfile = z.object({
  schemaVersion: z.literal(1),
  summary: z.string(), // 2-3 sentences on how this person writes
  rules: z.array(Rule),
  examples: z.array(z.object({
    context: Context,
    text: z.string(),
    sourceSampleId: z.string().optional(),
  })).max(5),
  guardrails: z.array(z.string()),
});
export type VoiceProfile = z.infer<typeof VoiceProfile>;

export const DEFAULT_GUARDRAILS = [
  "Preserve the facts and intent of the request.",
  "Do not invent personal experiences, opinions or credentials.",
  "Adapt to the audience and the requested format.",
] as const;
