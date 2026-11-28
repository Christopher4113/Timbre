import "server-only";
import { and, asc, count, desc, eq, max, sql } from "drizzle-orm";
import { db } from "./client";
import { aiUsage, comparisons, consents, interviews, profileJobs, profiles, samples, users } from "./schema";
import type { VoiceProfile } from "@/lib/schema";
import { LIMITS, type LimitBucket } from "@/lib/rate-limit";

// Every function takes userId and scopes by it. Drizzle parameterizes all values;
// never build SQL with string concatenation or sql.raw on user input.

export async function getLatestConsent(userId: string) {
  const [row] = await db.select().from(consents).where(eq(consents.userId, userId)).orderBy(desc(consents.acceptedAt)).limit(1);
  return row ?? null;
}

export async function listConsents(userId: string) {
  return db.select().from(consents).where(eq(consents.userId, userId)).orderBy(desc(consents.acceptedAt));
}

export async function recordConsent(userId: string, version: string, scopes: Record<string, boolean>) {
  await db.insert(consents).values({ userId, version, scopes });
}

/** Atomically count a hit. Returns ok=false once the window's max is exceeded. */
export async function hitRateLimit(userId: string, bucket: LimitBucket) {
  const { max, windowSec } = LIMITS[bucket];
  const expired = sql`${aiUsage.windowStart} < now() - make_interval(secs => ${windowSec})`;
  const [row] = await db
    .insert(aiUsage)
    .values({ key: `${userId}:${bucket}`, count: 1 })
    .onConflictDoUpdate({
      target: aiUsage.key,
      set: {
        count: sql`case when ${expired} then 1 else ${aiUsage.count} + 1 end`,
        windowStart: sql`case when ${expired} then now() else ${aiUsage.windowStart} end`,
      },
    })
    .returning({ count: aiUsage.count, windowStart: aiUsage.windowStart });
  const resetAt = new Date(row.windowStart.getTime() + windowSec * 1000);
  return { ok: row.count <= max, remaining: Math.max(0, max - row.count), resetAt };
}

/** Deletes the user row; every app table cascades. */
export async function deleteAccount(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}

// ---- Samples ----
export type SampleContext = (typeof samples.$inferInsert)["context"];

export async function listSamples(userId: string) {
  return db.select().from(samples).where(eq(samples.userId, userId)).orderBy(asc(samples.createdAt));
}

export async function countSamples(userId: string) {
  const [row] = await db.select({ n: count() }).from(samples).where(eq(samples.userId, userId));
  return row.n;
}

export async function addSample(userId: string, s: { context: SampleContext; text: string; aiDraft?: string | null }) {
  await db.insert(samples).values({ userId, context: s.context, text: s.text, aiDraft: s.aiDraft || null });
}

export async function deleteSample(userId: string, id: string) {
  await db.delete(samples).where(and(eq(samples.id, id), eq(samples.userId, userId)));
}

// ---- Interviews ----
export async function listReadyInterviews(userId: string) {
  return db.select().from(interviews).where(and(eq(interviews.userId, userId), eq(interviews.status, "ready")));
}

export async function getLatestInterview(userId: string) {
  const [row] = await db.select().from(interviews).where(eq(interviews.userId, userId)).orderBy(desc(interviews.createdAt)).limit(1);
  return row ?? null;
}

/** Called by the client right after the voice session connects. Ownership comes from the session, never the agent. */
export async function registerInterview(userId: string, conversationId: string) {
  const [row] = await db.insert(interviews).values({ userId, conversationId }).onConflictDoNothing().returning({ id: interviews.id });
  return row ?? null; // null: conversation already registered (possibly by someone else)
}

export async function saveSegments(userId: string, id: string, segments: unknown) {
  await db.update(interviews).set({ scenarioSegments: segments }).where(and(eq(interviews.id, id), eq(interviews.userId, userId)));
}

/** Webhook only: the post-call webhook has no session, so it looks up the owner by conversation id. */
export async function findInterviewForWebhook(conversationId: string) {
  const [row] = await db.select().from(interviews).where(eq(interviews.conversationId, conversationId));
  return row ?? null;
}

export async function completeInterview(userId: string, id: string, transcript: unknown) {
  await db.update(interviews).set({ transcript, status: "ready" }).where(and(eq(interviews.id, id), eq(interviews.userId, userId)));
}

export async function getUser(userId: string) {
  const [row] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, userId));
  return row ?? null;
}

// ---- Profiles (append-only) ----
export async function getLatestProfile(userId: string) {
  const [row] = await db.select().from(profiles).where(eq(profiles.userId, userId)).orderBy(desc(profiles.version)).limit(1);
  return row ?? null;
}

/** Inserts the next version. The (user_id, version) unique index rejects a concurrent duplicate. */
export async function insertProfileVersion(
  userId: string,
  v: { data: VoiceProfile; source: "build" | "edit"; promptVersion?: string | null; model?: string | null },
) {
  const [{ latest }] = await db.select({ latest: max(profiles.version) }).from(profiles).where(eq(profiles.userId, userId));
  const [row] = await db
    .insert(profiles)
    .values({ userId, version: (latest ?? 0) + 1, parentVersion: latest, data: v.data, source: v.source, promptVersion: v.promptVersion, model: v.model })
    .returning();
  return row;
}

// ---- Profile build jobs ----
export async function createJob(userId: string) {
  const [row] = await db.insert(profileJobs).values({ userId, status: "running" }).returning();
  return row;
}

export async function getJob(userId: string, id: string) {
  const [row] = await db.select().from(profileJobs).where(and(eq(profileJobs.id, id), eq(profileJobs.userId, userId)));
  return row ?? null;
}

export async function getActiveJob(userId: string) {
  const [row] = await db
    .select()
    .from(profileJobs)
    // A job "running" for over 10 min is treated as dead so the user can start another.
    .where(and(eq(profileJobs.userId, userId), eq(profileJobs.status, "running"), sql`${profileJobs.createdAt} > now() - interval '10 minutes'`))
    .orderBy(desc(profileJobs.createdAt))
    .limit(1);
  return row ?? null;
}

export async function finishJob(userId: string, id: string, result: { profileId: string } | { error: string }) {
  await db
    .update(profileJobs)
    .set("profileId" in result ? { status: "done", profileId: result.profileId } : { status: "failed", error: result.error })
    .where(and(eq(profileJobs.id, id), eq(profileJobs.userId, userId)));
}

// ---- Playground comparisons ----
export async function insertComparison(userId: string, c: Omit<typeof comparisons.$inferInsert, "id" | "userId" | "createdAt">) {
  const [row] = await db.insert(comparisons).values({ ...c, userId }).returning({ id: comparisons.id });
  return row;
}

export async function getComparison(userId: string, id: string) {
  const [row] = await db.select().from(comparisons).where(and(eq(comparisons.id, id), eq(comparisons.userId, userId)));
  return row ?? null;
}

export async function updateComparison(
  userId: string,
  id: string,
  patch: Partial<Pick<typeof comparisons.$inferInsert, "picked" | "sendAsIs" | "editedText" | "editDistance">>,
) {
  await db.update(comparisons).set(patch).where(and(eq(comparisons.id, id), eq(comparisons.userId, userId)));
}

export async function countComparisons(userId: string) {
  const [row] = await db
    .select({ total: count(), picked: count(comparisons.picked) })
    .from(comparisons)
    .where(eq(comparisons.userId, userId));
  return row;
}
