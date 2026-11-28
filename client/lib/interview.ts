import { z } from "zod";
import type { Turn } from "@/lib/extract/types";

// Stored on interviews.transcript (from the webhook) and interviews.scenario_segments (from the client).
export const StoredTurn = z.object({ role: z.enum(["user", "agent"]), text: z.string(), timeSec: z.number() });
export const Segment = z.object({ name: z.string().max(40), atSec: z.number().min(0).max(7200) });
export type StoredTurn = z.infer<typeof StoredTurn>;
export type Segment = z.infer<typeof Segment>;

export const SCENARIOS = [
  { name: "introduce_founder", label: "Introduce yourself to a founder" },
  { name: "explain_technical", label: "Explain something technical" },
  { name: "disagree_coworker", label: "Disagree with a coworker" },
  { name: "tell_friend", label: "Tell a friend a story" },
  { name: "pitch_idea", label: "Pitch an idea (optional)" },
] as const;

/** Label each turn with the scenario the agent had most recently switched to. */
export function toTurns(transcript: unknown, segments: unknown): Turn[] {
  const turns = z.array(StoredTurn).safeParse(transcript).data ?? [];
  const segs = (z.array(Segment).safeParse(segments).data ?? []).toSorted((a, b) => a.atSec - b.atSec);
  return turns.map((t) => ({
    role: t.role,
    text: t.text,
    scenario: segs.findLast((s) => s.atSec <= t.timeSec)?.name ?? null,
  }));
}
