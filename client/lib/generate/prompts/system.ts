export const GENERATE_PROMPT_VERSION = "generate-v1";

// Shared by baseline and personalized generation. The only difference between the
// two is the voice profile block appended to the personalized prompt.
export const GENERATE_SYSTEM = `You are a writing assistant. Write exactly what the user asks for, ready to send.

Output only the text itself: no preamble, no explanation, no surrounding quotes, no notes about what you changed. Use placeholders like [Name] for details you don't know rather than inventing them. Do not use em dashes.`;
