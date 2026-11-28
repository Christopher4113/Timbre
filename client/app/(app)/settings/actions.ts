"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { deleteAccount, deleteInterviews, deleteProfiles, deleteSamples } from "@/lib/db/queries";
import { deleteConversations } from "@/lib/elevenlabs";
import { requireUser } from "@/lib/session";

// requireUser (not requireConsentedUser): deletion must work even if consent was never given or has changed.

export async function deleteTranscriptsAction() {
  const user = await requireUser();
  await deleteConversations(await deleteInterviews(user.id));
  revalidatePath("/", "layout");
}

export async function deleteSamplesAction() {
  const user = await requireUser();
  await deleteSamples(user.id);
  revalidatePath("/", "layout");
}

export async function deleteProfilesAction() {
  const user = await requireUser();
  await deleteProfiles(user.id);
  revalidatePath("/", "layout");
}

export async function deleteAccountAction() {
  const user = await requireUser();
  await deleteConversations(await deleteAccount(user.id));
  // The session row is gone (cascade); clear the cookie too.
  const jar = await cookies();
  for (const c of jar.getAll()) if (c.name.includes("better-auth")) jar.delete(c.name);
  redirect("/?deleted=1");
}
