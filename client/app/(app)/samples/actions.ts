"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { runProfileBuild } from "@/lib/build-profile";
import { addSample, countSamples, createJob, deleteSample, getActiveJob, hitRateLimit } from "@/lib/db/queries";
import { MAX_SAMPLES, MIN_SAMPLES } from "@/lib/samples";
import { displayName, requireConsentedUser } from "@/lib/session";

const SampleForm = z.object({
  context: z.enum(["outreach", "application", "casual", "technical", "other"]),
  text: z.string().trim().min(20, "Paste at least a couple of sentences.").max(8000, "Keep each sample under 8,000 characters."),
  aiDraft: z.string().trim().max(8000, "Keep the AI draft under 8,000 characters.").optional(),
});

export type ActionState = { error?: string; ok?: number };

export async function addSampleAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireConsentedUser();
  const parsed = SampleForm.safeParse({
    context: form.get("context"),
    text: form.get("text"),
    aiDraft: form.get("aiDraft") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if ((await countSamples(user.id)) >= MAX_SAMPLES) return { error: `You can add up to ${MAX_SAMPLES} samples. Delete one first.` };
  await addSample(user.id, parsed.data);
  revalidatePath("/samples");
  return { ok: Date.now() }; // changes each time so the form can reset
}

export async function deleteSampleAction(form: FormData) {
  const user = await requireConsentedUser();
  const id = z.uuid().safeParse(form.get("id"));
  if (id.success) await deleteSample(user.id, id.data);
  revalidatePath("/samples");
}

export async function startBuildAction() {
  const user = await requireConsentedUser();
  const active = await getActiveJob(user.id);
  if (active) redirect(`/building?job=${active.id}`);
  if ((await countSamples(user.id)) < MIN_SAMPLES) redirect("/samples?error=too_few");
  if (!(await hitRateLimit(user.id, "profileBuild")).ok) redirect("/samples?error=rate_limited");

  const job = await createJob(user.id);
  after(() => runProfileBuild(user.id, job.id, displayName(user)));
  redirect(`/building?job=${job.id}`);
}
