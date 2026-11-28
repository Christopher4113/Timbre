import "server-only";
import { z } from "zod";
import { buildProfile } from "@/lib/extract/pipeline";
import { Turn } from "@/lib/extract/types";
import { finishJob, insertProfileVersion, listReadyInterviews, listSamples } from "@/lib/db/queries";

/**
 * Builds a profile from the user's samples (and interview transcripts, once step 5 lands)
 * and records the result on the job. Never throws: failures are written to the job.
 * Step 5 moves this body into the Inngest `profile.build` function.
 */
export async function runProfileBuild(userId: string, jobId: string, name: string) {
  try {
    const [samples, interviews] = await Promise.all([listSamples(userId), listReadyInterviews(userId)]);
    const turns = interviews.flatMap((i) => z.array(Turn).safeParse(i.transcript).data ?? []);
    const { profile, promptVersion, model } = await buildProfile({
      name,
      turns,
      samples: samples.map((s) => ({ id: s.id, context: s.context, text: s.text, aiDraft: s.aiDraft ?? undefined })),
    });
    const row = await insertProfileVersion(userId, { data: profile, source: "build", promptVersion, model });
    await finishJob(userId, jobId, { profileId: row.id });
  } catch (e) {
    console.error("profile build failed", { jobId, error: e instanceof Error ? e.message : e });
    await finishJob(userId, jobId, { error: "We couldn't build your profile this time. Try again in a minute." });
  }
}
