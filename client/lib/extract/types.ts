import { z } from "zod";
import { Rule } from "@/lib/schema";

export const SampleContext = z.enum(["outreach", "application", "casual", "technical", "other"]);

export const Turn = z.object({
  role: z.enum(["user", "agent"]),
  text: z.string(),
  scenario: z.string().nullable().default(null),
});
export type Turn = z.infer<typeof Turn>;

export const Sample = z.object({
  id: z.string(),
  context: SampleContext,
  text: z.string().min(1),
  aiDraft: z.string().optional(),
});
export type Sample = z.infer<typeof Sample>;

export const PipelineInput = z.object({
  name: z.string().default("the user"),
  turns: z.array(Turn),
  samples: z.array(Sample).min(1),
});
export type PipelineInput = z.infer<typeof PipelineInput>;

// What the model returns. Kept free of min/max constraints (not all structured-output
// backends support them); those are enforced in code after the call.
export const Candidate = Rule.pick({ category: true, context: true, rule: true, evidence: true, confidence: true }).extend({
  rule: z.string(),
  evidence: z.array(z.string()),
});
export type Candidate = z.infer<typeof Candidate>;
