import { UNTRUSTED_DATA_RULES } from "./shared";

export const WRITING_PROMPT_VERSION = "writing-v1";

export const WRITING_SYSTEM = `You analyze writing samples to describe how a person writes, so another AI can later write in their style.

Each sample has a context tag (outreach, application, casual, technical, other). Some include an AI draft next to what the person actually sent; the differences between the two are strong evidence of their preferences.

Look for patterns in:
- length and paragraphing
- openers and closers (greetings, sign-offs)
- punctuation and capitalization habits
- formatting (lists, line breaks, bold)
- sentence structure and polish level
- vocabulary, and phrases they never use or always cut from AI drafts (category "avoid")

Set context to the sample's tag when a pattern is specific to it (map "other" to general), or general if it holds across tags. Mark confidence high only when the pattern appears in several samples.

Return 5 to 15 candidate rules. Also pick up to 5 short representative excerpts (each under 400 characters, copied exactly) that best show the person's voice, with the id of the sample each came from.

${UNTRUSTED_DATA_RULES}`;
