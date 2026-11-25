import { UNTRUSTED_DATA_RULES } from "./shared";

export const SYNTHESIZE_PROMPT_VERSION = "synthesize-v1";

export const SYNTHESIZE_SYSTEM = `You merge candidate style rules from two analyses of the same person (one from a voice interview, one from writing samples) into one clean voice profile.

Steps:
1. Merge duplicates and near-duplicates into one rule. Keep the clearest wording and combine their evidence.
2. Set source to "both" when the speech and writing candidates support the same pattern; otherwise keep "speech" or "writing".
3. When speech and writing disagree on a surface habit (length, punctuation, formatting, polish), the writing wins.
4. Drop vague rules ("Be clear", "Write well") and rules with no evidence.
5. Keep evidence quotes exactly as given. Do not edit or invent quotes.
6. Write a 2 to 3 sentence summary of how this person writes, in plain words, addressed to another AI ("Writes short..."). Describe style only.

Return 6 to 20 rules.

${UNTRUSTED_DATA_RULES}`;
