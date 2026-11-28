import { generateText, Output } from "ai";
import { z } from "zod";
import { callSettings, modelFromEnv } from "@/lib/llm";
import { SPEECH_SYSTEM } from "./prompts/speech";
import { wrap } from "./prompts/shared";
import { Candidate, type Turn } from "./types";

/** User turns only, grouped by scenario, each group in its own <transcript> block. */
export function speechPrompt(turns: Turn[]): string | null {
  const groups = new Map<string, string[]>();
  for (const t of turns) {
    if (t.role !== "user" || !t.text.trim()) continue;
    const key = t.scenario ?? "unlabeled";
    groups.set(key, [...(groups.get(key) ?? []), t.text.trim()]);
  }
  if (!groups.size) return null;
  const blocks = [...groups].map(([scenario, texts]) => wrap("transcript", texts.join("\n\n"), { scenario }));
  return `Here are the person's interview answers.\n\n${blocks.join("\n\n")}`;
}

export async function extractSpeech(turns: Turn[]): Promise<Candidate[]> {
  const prompt = speechPrompt(turns);
  if (!prompt) return []; // samples-only profile
  const { output } = await generateText({
    model: modelFromEnv("extract").model,
    ...callSettings("extract"),
    telemetry: { functionId: "extract-speech" },
    system: SPEECH_SYSTEM,
    prompt,
    output: Output.object({ schema: z.object({ candidates: z.array(Candidate) }) }),
  });
  return output.candidates;
}
