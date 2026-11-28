import { GENERATE_SYSTEM } from "./prompts/system";
import { generateDraft } from "./shared";

export function baselineSystem() {
  return GENERATE_SYSTEM;
}

export function generateBaseline(task: string) {
  return generateDraft(baselineSystem(), task);
}
