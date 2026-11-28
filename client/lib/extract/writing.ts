import { generateText, Output } from "ai";
import { z } from "zod";
import { callSettings, modelFromEnv } from "@/lib/llm";
import { WRITING_SYSTEM } from "./prompts/writing";
import { wrap } from "./prompts/shared";
import { Candidate, type Sample } from "./types";

export const WritingOutput = z.object({
  candidates: z.array(Candidate),
  examples: z.array(z.object({ sampleId: z.string(), text: z.string() })),
});
export type WritingOutput = z.infer<typeof WritingOutput>;

export function writingPrompt(samples: Sample[]): string {
  const blocks = samples.map((s) => {
    const body = s.aiDraft ? `${wrap("ai_draft", s.aiDraft)}\n${wrap("sent", s.text)}` : s.text;
    return wrap("sample", body, { id: s.id, context: s.context });
  });
  return `Here are the person's writing samples.\n\n${blocks.join("\n\n")}`;
}

export async function extractWriting(samples: Sample[]): Promise<WritingOutput> {
  const { output } = await generateText({
    model: modelFromEnv("extract").model,
    ...callSettings("extract"),
    telemetry: { functionId: "extract-writing" },
    system: WRITING_SYSTEM,
    prompt: writingPrompt(samples),
    output: Output.object({ schema: WritingOutput }),
  });
  return output;
}
