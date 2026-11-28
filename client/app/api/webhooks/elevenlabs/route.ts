import { z } from "zod";
import { startBuild } from "@/lib/build-profile";
import { completeInterview, countSamples, findInterviewForWebhook, getUser } from "@/lib/db/queries";
import { verifyWebhookSignature } from "@/lib/elevenlabs";
import type { StoredTurn } from "@/lib/interview";
import { MIN_SAMPLES } from "@/lib/samples";
import { displayName } from "@/lib/session";

const Payload = z.object({
  type: z.string(),
  data: z.object({
    agent_id: z.string(),
    conversation_id: z.string(),
    transcript: z
      .array(z.object({ role: z.enum(["user", "agent"]), message: z.string().nullish(), time_in_call_secs: z.number().default(0) }).loose())
      .default([]),
  }).loose(),
});

const ok = (note: string) => Response.json({ ok: true, note });

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("elevenlabs-signature"), process.env.ELEVENLABS_WEBHOOK_SECRET ?? "")) {
    return Response.json({ error: "invalid_signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = Payload.safeParse(json);
  if (!parsed.success) return Response.json({ error: "bad_payload" }, { status: 400 });
  const { type, data } = parsed.data;
  if (type !== "post_call_transcription") return ok("ignored_type");
  if (data.agent_id !== process.env.ELEVENLABS_AGENT_ID) return ok("ignored_agent");

  const interview = await findInterviewForWebhook(data.conversation_id);
  if (!interview) return Response.json({ error: "unknown_conversation" }, { status: 404 });
  if (interview.status === "ready") return ok("duplicate"); // idempotent on conversation_id

  // Text only. Audio is never requested or stored.
  const transcript: StoredTurn[] = data.transcript
    .filter((t) => t.message?.trim())
    .map((t) => ({ role: t.role, text: t.message!.trim(), timeSec: t.time_in_call_secs }));
  await completeInterview(interview.userId, interview.id, transcript);

  // Rebuild with the interview if the user already has enough samples; otherwise
  // the build starts when they submit samples.
  if ((await countSamples(interview.userId)) >= MIN_SAMPLES) {
    const user = await getUser(interview.userId);
    if (user) await startBuild(user.id, displayName(user));
  }
  return ok("stored");
}
