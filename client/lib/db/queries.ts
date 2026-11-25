import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "./client";
import { aiUsage, consents, users } from "./schema";
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
