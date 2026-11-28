import { randomInt } from "node:crypto";
import { z } from "zod";
import { getLatestProfile, insertComparison } from "@/lib/db/queries";
import { generateBaseline } from "@/lib/generate/baseline";
import { generatePersonalized } from "@/lib/generate/personalized";
import { GENERATE_PROMPT_VERSION } from "@/lib/generate/prompts/system";
import { traced } from "@/lib/langfuse";
import { modelFromEnv } from "@/lib/llm";
import { VoiceProfile } from "@/lib/schema";
import { apiUser } from "@/lib/session";

export const maxDuration = 120;

const Body = z.object({ task: z.string().trim().min(10).max(4000) });

/** Playground: baseline and profile drafts for one task, returned unlabeled in random order. */
export async function POST(req: Request) {
  const auth = await apiUser("generate");
  if ("error" in auth) return auth.error;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "bad_request" }, { status: 400 });

  const row = await getLatestProfile(auth.user.id);
  if (!row) return Response.json({ error: "no_profile" }, { status: 409 });
  const profile = VoiceProfile.parse(row.data);

  let baseline: string, personalized: string;
  try {
    [baseline, personalized] = await traced(auth.user.id, "playground", () =>
      Promise.all([generateBaseline(body.data.task), generatePersonalized(body.data.task, profile)]),
    );
  } catch (e) {
    console.error("playground generation failed", e instanceof Error ? e.message : e);
    return Response.json({ error: "generation_failed" }, { status: 502 });
  }

  const leftIs = randomInt(2) === 0 ? "baseline" : "profile";
  const saved = await insertComparison(auth.user.id, {
    profileId: row.id,
    task: body.data.task,
    baselineOutput: baseline,
    profileOutput: personalized,
    leftIs,
    model: modelFromEnv("generate").id,
    promptVersion: GENERATE_PROMPT_VERSION,
  });

  // Never tell the client which side is which.
  const [left, right] = leftIs === "baseline" ? [baseline, personalized] : [personalized, baseline];
  return Response.json({ id: saved.id, left, right });
}
