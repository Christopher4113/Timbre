import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq, like } from "drizzle-orm";
import { handProfile } from "../fixtures";

// Hits the real database. Run with `pnpm test:db` (loads .env.local).
describe.skipIf(!process.env.DATABASE_URL)("delete paths (Neon)", async () => {
  const { db } = await import("@/lib/db/client");
  const s = await import("@/lib/db/schema");
  const q = await import("@/lib/db/queries");

  const userId = `test-delete-${crypto.randomUUID()}`;
  const otherId = `test-delete-other-${crypto.randomUUID()}`;

  async function seed(id: string) {
    await db.insert(s.users).values({ id, name: "", email: `${id}@timbre.test`, emailVerified: true }).onConflictDoNothing();
    await db.insert(s.sessions).values({ id: `sess-${crypto.randomUUID()}`, userId: id, token: crypto.randomUUID(), expiresAt: new Date(Date.now() + 864e5) });
    await q.recordConsent(id, "test", { recording: true });
    await q.registerInterview(id, `conv_test_${crypto.randomUUID()}`);
    await q.addSample(id, { context: "casual", text: "a sample long enough to count" });
    const profile = await q.insertProfileVersion(id, { data: handProfile, source: "build" });
    await q.insertComparison(id, { profileId: profile.id, task: "t", baselineOutput: "b", profileOutput: "p", leftIs: "baseline", model: "m" });
    await q.createJob(id);
    await q.hitRateLimit(id, "generate");
  }

  const total = (id: string) => q.getDataCounts(id);

  beforeEach(async () => {
    await q.deleteAccount(userId);
    await q.deleteAccount(otherId);
    await seed(userId);
    await seed(otherId);
  });

  afterAll(async () => {
    await q.deleteAccount(userId);
    await q.deleteAccount(otherId);
  });

  it("deleteInterviews removes only this user's transcripts and returns conversation ids", async () => {
    const ids = await q.deleteInterviews(userId);
    expect(ids).toHaveLength(1);
    expect(ids[0]).toMatch(/^conv_test_/);
    expect(await total(userId)).toMatchObject({ interviews: 0, samples: 1, profiles: 1, comparisons: 1 });
    expect((await total(otherId)).interviews).toBe(1);
  });

  it("deleteSamples removes only samples", async () => {
    expect(await q.deleteSamples(userId)).toBe(1);
    expect(await total(userId)).toMatchObject({ interviews: 1, samples: 0, profiles: 1 });
    expect((await total(otherId)).samples).toBe(1);
  });

  it("deleteProfiles removes all versions and their comparisons", async () => {
    await q.insertProfileVersion(userId, { data: handProfile, source: "edit" });
    expect(await q.deleteProfiles(userId)).toBe(2);
    expect(await total(userId)).toMatchObject({ interviews: 1, samples: 1, profiles: 0, comparisons: 0 });
    expect((await total(otherId)).profiles).toBe(1);
  });

  it("deleteAccount removes the user, every app table, sessions and rate-limit counters", async () => {
    const ids = await q.deleteAccount(userId);
    expect(ids).toHaveLength(1);
    expect(await total(userId)).toEqual({ interviews: 0, samples: 0, profiles: 0, comparisons: 0 });
    const left = await Promise.all([
      db.select().from(s.users).where(eq(s.users.id, userId)),
      db.select().from(s.sessions).where(eq(s.sessions.userId, userId)),
      db.select().from(s.consents).where(eq(s.consents.userId, userId)),
      db.select().from(s.profileJobs).where(eq(s.profileJobs.userId, userId)),
      db.select().from(s.aiUsage).where(like(s.aiUsage.key, `${userId}:%`)),
    ]);
    expect(left.map((r) => r.length)).toEqual([0, 0, 0, 0, 0]);
    expect(await total(otherId)).toEqual({ interviews: 1, samples: 1, profiles: 1, comparisons: 1 });
  });
});
