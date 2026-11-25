import { DEFAULT_GUARDRAILS, VoiceProfile } from "@/lib/schema";

// Hand-written profile used by renderer snapshot tests.
export const handProfile = VoiceProfile.parse({
  schemaVersion: 1,
  summary: "Writes short, warm messages that get to the point fast. Explains with concrete examples rather than theory.",
  rules: [
    { id: "r1", category: "openers_closers", context: "outreach", rule: "Lead with the reason for reaching out.", source: "both", evidence: ["I'm reaching out because"], confidence: "high", status: "approved" },
    { id: "r2", category: "length", context: "general", rule: "Keep messages under five sentences.", source: "writing", evidence: ["Thanks! Talk soon."], confidence: "medium", status: "inferred" },
    { id: "r3", category: "explanation", context: "technical", rule: "Start with a concrete example, then the general idea.", source: "speech", evidence: ["so imagine you have a list"], confidence: "high", status: "edited" },
    { id: "r4", category: "avoid", context: "general", rule: "Never open with 'I hope this email finds you well'.", source: "writing", evidence: ["Hey Sam,"], confidence: "high", status: "approved" },
    { id: "r5", category: "humor", context: "casual", rule: "Use light self-deprecating jokes.", source: "speech", evidence: ["classic me, honestly"], confidence: "low", status: "inferred" },
  ],
  examples: [
    { context: "outreach", text: "Hey Sam, I'm reaching out because your post on onboarding hit home." },
    { context: "casual", text: "ok that hike destroyed me, 10/10 would do again" },
  ],
  guardrails: [...DEFAULT_GUARDRAILS],
});
