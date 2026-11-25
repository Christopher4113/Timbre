import { generateText, Output } from "ai";
import { z } from "zod";
import { callSettings, modelFromEnv } from "@/lib/llm";
import { DEFAULT_GUARDRAILS, Rule, VoiceProfile, type Context } from "@/lib/schema";
import { SYNTHESIZE_SYSTEM } from "./prompts/synthesize";
import { wrap } from "./prompts/shared";
import { Candidate, type PipelineInput } from "./types";
import type { WritingOutput } from "./writing";

const Merged = z.object({
  summary: z.string(),
  rules: z.array(Candidate.extend({ source: Rule.shape.source })),
});
type Merged = z.infer<typeof Merged>;

// Spoken phrasing never becomes a surface-level writing rule on its own.
const SPEECH_ONLY_OK = new Set<Rule["category"]>(["directness", "explanation", "storytelling", "humor", "persuasion", "openers_closers"]);

const norm = (s: string) =>
  s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();

/** Turn model output into a valid profile, enforcing the rules the prompt can't guarantee. */
export function assembleProfile(merged: Merged, input: PipelineInput, examples: WritingOutput["examples"]): VoiceProfile {
  const speechCorpus = norm(input.turns.filter((t) => t.role === "user").map((t) => t.text).join("\n"));
  const writingCorpus = norm(input.samples.map((s) => s.text).join("\n")); // never the AI drafts
  const inData = (q: string) => {
    const n = norm(q);
    return n.length > 0 && (speechCorpus.includes(n) || writingCorpus.includes(n));
  };

  const rules: Rule[] = [];
  for (const r of merged.rules) {
    const evidence = [...new Set(r.evidence.filter(inData))];
    if (!evidence.length || r.rule.trim().length < 5) continue;
    if (r.source === "speech" && !SPEECH_ONLY_OK.has(r.category)) continue;
    rules.push({ ...r, rule: r.rule.trim(), evidence, id: `r${rules.length + 1}`, status: "inferred" });
  }

  const byId = new Map(input.samples.map((s) => [s.id, s]));
  const keptExamples = examples
    .filter((e) => byId.has(e.sampleId) && norm(byId.get(e.sampleId)!.text).includes(norm(e.text)))
    .slice(0, 5)
    .map((e) => {
      const ctx = byId.get(e.sampleId)!.context;
      return { context: (ctx === "other" ? "general" : ctx) as Context, text: e.text, sourceSampleId: e.sampleId };
    });

  return VoiceProfile.parse({
    schemaVersion: 1,
    summary: merged.summary.trim(),
    rules,
    examples: keptExamples,
    guardrails: [...DEFAULT_GUARDRAILS],
  });
}

export function synthesizePrompt(speech: Candidate[], writing: Candidate[]) {
  return [
    "Candidate rules from the voice interview:",
    wrap("candidates", JSON.stringify(speech, null, 1), { source: "speech" }),
    "Candidate rules from the writing samples:",
    wrap("candidates", JSON.stringify(writing, null, 1), { source: "writing" }),
  ].join("\n\n");
}

/** Merge candidates into a profile. Retries once if the result fails validation. */
export async function synthesize(input: PipelineInput, speech: Candidate[], writing: WritingOutput): Promise<VoiceProfile> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { output } = await generateText({
        model: modelFromEnv("extract").model,
        ...callSettings("extract"),
        system: SYNTHESIZE_SYSTEM,
        prompt: synthesizePrompt(speech, writing.candidates),
        output: Output.object({ schema: Merged }),
      });
      const profile = assembleProfile(output, input, writing.examples);
      if (!profile.rules.length) throw new Error("synthesis produced no rules with verbatim evidence");
      return profile;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}
