import { renderCustomInstructions } from "@/lib/export/custom-instructions";
import type { VoiceProfile } from "@/lib/schema";
import { GENERATE_SYSTEM } from "./prompts/system";
import { generateDraft } from "./shared";

export function personalizedSystem(profile: VoiceProfile) {
  return `${GENERATE_SYSTEM}

Write in the voice of the person described below. Follow their style rules unless the task asks for a different format.

<voice_profile>
${renderCustomInstructions(profile)}
</voice_profile>`;
}

export function generatePersonalized(task: string, profile: VoiceProfile) {
  return generateDraft(personalizedSystem(profile), task);
}
