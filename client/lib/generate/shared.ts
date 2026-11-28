import { generateText } from "ai";
import { callSettings, modelFromEnv } from "@/lib/llm";

/** One generation call. Baseline and personalized share the model, settings and task. */
export async function generateDraft(system: string, task: string) {
  const { text } = await generateText({ model: modelFromEnv("generate").model, ...callSettings("generate"), system, prompt: task });
  return text.trim();
}
