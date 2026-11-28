"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { insertProfileVersion } from "@/lib/db/queries";
import { VoiceProfile } from "@/lib/schema";
import { requireConsentedUser } from "@/lib/session";

// The client sends the whole edited profile: treat it as untrusted and bound its size.
const EditedProfile = VoiceProfile.extend({
  summary: z.string().trim().min(1).max(1200),
  rules: VoiceProfile.shape.rules.max(60),
}).refine((p) => p.rules.every((r) => r.rule.length <= 400), "Rules must be under 400 characters.")
  .refine((p) => new Set(p.rules.map((r) => r.id)).size === p.rules.length, "Duplicate rule ids.");

export async function saveProfileAction(data: unknown): Promise<{ version?: number; error?: string }> {
  const user = await requireConsentedUser();
  const parsed = EditedProfile.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const row = await insertProfileVersion(user.id, { data: parsed.data, source: "edit" });
  revalidatePath("/review");
  revalidatePath("/export");
  return { version: row.version };
}
