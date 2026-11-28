import { z } from "zod";
import { finishJob, insertProfileVersion } from "@/lib/db/queries";
import { loadPipelineInput } from "@/lib/build-profile";
import { PIPELINE_PROMPT_VERSION } from "@/lib/extract/pipeline";
import { extractSpeech } from "@/lib/extract/speech";
import { synthesize } from "@/lib/extract/synthesize";
import { PipelineInput } from "@/lib/extract/types";
import { extractWriting } from "@/lib/extract/writing";
import { traced } from "@/lib/langfuse";
import { modelFromEnv } from "@/lib/llm";
import { VoiceProfile } from "@/lib/schema";
import { inngest } from "./client";

const BuildEvent = z.object({ userId: z.string(), jobId: z.uuid(), name: z.string() });

export const buildProfileFn = inngest.createFunction(
  {
    id: "build-profile",
    triggers: [{ event: "profile.build" }],
    retries: 2,
    concurrency: { key: "event.data.userId", limit: 1 },
    onFailure: async ({ event, error }) => {
      const data = BuildEvent.safeParse(event.data.event.data);
      console.error("profile build failed", { error: error.message });
      if (data.success) await finishJob(data.data.userId, data.data.jobId, { error: "We couldn't build your profile this time. Try again in a minute." });
    },
  },
  async ({ event, step }) => {
    const { userId, jobId, name } = BuildEvent.parse(event.data);

    // Each step is retried on its own and its result is checkpointed, so a failed
    // synthesis doesn't re-run the extractors.
    const input = PipelineInput.parse(await step.run("load-input", () => loadPipelineInput(userId, name)));
    const [speech, writing] = await Promise.all([
      step.run("extract-speech", () => traced(userId, "build-profile", () => extractSpeech(input.turns))),
      step.run("extract-writing", () => traced(userId, "build-profile", () => extractWriting(input.samples))),
    ]);
    const profile = VoiceProfile.parse(await step.run("synthesize", () => traced(userId, "build-profile", () => synthesize(input, speech, writing))));

    return step.run("save", async () => {
      const row = await insertProfileVersion(userId, { data: profile, source: "build", promptVersion: PIPELINE_PROMPT_VERSION, model: modelFromEnv("extract").id });
      await finishJob(userId, jobId, { profileId: row.id });
      return { profileId: row.id, version: row.version };
    });
  },
);
