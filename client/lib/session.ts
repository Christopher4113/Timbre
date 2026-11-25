import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLatestConsent, hitRateLimit } from "@/lib/db/queries";
import type { LimitBucket } from "@/lib/rate-limit";

export const CONSENT_VERSION = "2026-11-25";

export async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** Pages: signed in, else back to the landing page. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/?signin=1");
  return user;
}

/** Pages behind consent: signed in and accepted the current consent version. */
export async function requireConsentedUser() {
  const user = await requireUser();
  const consent = await getLatestConsent(user.id);
  if (consent?.version !== CONSENT_VERSION) redirect("/consent");
  return user;
}

/**
 * Route handlers: returns the user or a Response to send back.
 * Pass a bucket for anything that spends model credits.
 */
export async function apiUser(bucket?: LimitBucket) {
  const user = await getUser();
  if (!user) return { error: Response.json({ error: "unauthorized" }, { status: 401 }) } as const;
  const consent = await getLatestConsent(user.id);
  if (consent?.version !== CONSENT_VERSION) return { error: Response.json({ error: "consent_required" }, { status: 403 }) } as const;
  if (bucket) {
    const rl = await hitRateLimit(user.id, bucket);
    if (!rl.ok) {
      const retry = Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000);
      return { error: Response.json({ error: "rate_limited", retryAfter: retry }, { status: 429, headers: { "Retry-After": String(retry) } }) } as const;
    }
  }
  return { user } as const;
}
