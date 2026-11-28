import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

// Hits the real database. Run with `pnpm test:db` (loads .env.local).
describe.skipIf(!process.env.DATABASE_URL)("hitRateLimit (Neon)", () => {
  it("allows max hits per window, then blocks", async () => {
    const { hitRateLimit } = await import("@/lib/db/queries");
    const { db } = await import("@/lib/db/client");
    const { aiUsage } = await import("@/lib/db/schema");
    const uid = `test-${crypto.randomUUID()}`;
    try {
      const results = [];
      for (let i = 0; i < 7; i++) results.push((await hitRateLimit(uid, "interview")).ok); // max 5
      expect(results).toEqual([true, true, true, true, true, false, false]);
    } finally {
      await db.delete(aiUsage).where(eq(aiUsage.key, `${uid}:interview`));
    }
  });
});
