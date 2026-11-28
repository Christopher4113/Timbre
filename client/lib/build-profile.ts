import "server-only";
import { createJob, getActiveJob, hitRateLimit, listReadyInterviews, listSamples } from "@/lib/db/queries";
import type { PipelineInput } from "@/lib/extract/types";
import { toTurns } from "@/lib/interview";
import { inngest } from "@/inngest/client";

export async function loadPipelineInput(userId: string, name: string): Promise<PipelineInput> {
  const [samples, interviews] = await Promise.all([listSamples(userId), listReadyInterviews(userId)]);
  return {
    name,
    turns: interviews.flatMap((i) => toTurns(i.transcript, i.scenarioSegments)),
    samples: samples.map((s) => ({ id: s.id, context: s.context, text: s.text, aiDraft: s.aiDraft ?? undefined })),
  };
}

/**
 * Starts a profile build unless one is already running. Counts against the daily build limit.
 * Returns the job id, or why it didn't start.
 */
export async function startBuild(userId: string, name: string): Promise<{ jobId: string } | { error: "rate_limited" }> {
  const active = await getActiveJob(userId);
  if (active) return { jobId: active.id };
  if (!(await hitRateLimit(userId, "profileBuild")).ok) return { error: "rate_limited" };
  const job = await createJob(userId);
  await inngest.send({ name: "profile.build", data: { userId, jobId: job.id, name } });
  return { jobId: job.id };
}
