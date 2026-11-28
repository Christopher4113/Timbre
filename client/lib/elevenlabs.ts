import { createHmac, timingSafeEqual } from "node:crypto";

/** Short-lived (15 min) signed WebSocket URL for one session with the private interview agent. Server-side only. */
export async function getSignedUrl(): Promise<string> {
  const url = new URL("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url");
  url.searchParams.set("agent_id", process.env.ELEVENLABS_AGENT_ID!);
  const res = await fetch(url, { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! }, cache: "no-store" });
  if (!res.ok) throw new Error(`ElevenLabs signed URL: ${res.status}`);
  const body = (await res.json()) as { signed_url?: string };
  if (!body.signed_url) throw new Error("ElevenLabs signed URL: missing signed_url");
  return body.signed_url;
}

/**
 * Verifies the `ElevenLabs-Signature` header: "t=<unix seconds>,v0=<hex HMAC-SHA256 of `${t}.${rawBody}`>".
 * Rejects stale timestamps to block replays.
 */
export function verifyWebhookSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowSec = Date.now() / 1000,
  toleranceSec = 30 * 60,
): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.trim().split("=", 2) as [string, string]));
  const t = Number(parts.t);
  if (!Number.isFinite(t) || !parts.v0 || Math.abs(nowSec - t) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v0);
  return a.length === b.length && timingSafeEqual(a, b);
}
