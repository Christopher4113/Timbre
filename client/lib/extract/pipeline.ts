import { modelFromEnv } from "@/lib/llm";
import type { VoiceProfile } from "@/lib/schema";
import { SPEECH_PROMPT_VERSION } from "./prompts/speech";
import { SYNTHESIZE_PROMPT_VERSION } from "./prompts/synthesize";
import { WRITING_PROMPT_VERSION } from "./prompts/writing";
import { extractSpeech } from "./speech";
import { synthesize } from "./synthesize";
import { PipelineInput } from "./types";
import { extractWriting } from "./writing";

export const PIPELINE_PROMPT_VERSION = [SPEECH_PROMPT_VERSION, WRITING_PROMPT_VERSION, SYNTHESIZE_PROMPT_VERSION].join("+");

export async function buildProfile(raw: unknown): Promise<{ profile: VoiceProfile; promptVersion: string; model: string }> {
  const input = PipelineInput.parse(raw);
  const [speech, writing] = await Promise.all([extractSpeech(input.turns), extractWriting(input.samples)]);
  const profile = await synthesize(input, speech, writing);
  return { profile, promptVersion: PIPELINE_PROMPT_VERSION, model: modelFromEnv("extract").id };
}
