import { propagateAttributes } from "@langfuse/tracing";

const baseUrl = () => (process.env.LANGFUSE_BASE_URL ?? process.env.LANGFUSE_HOST ?? "https://cloud.langfuse.com").replace(/\/$/, "");
const authHeader = () =>
  `Basic ${Buffer.from(`${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY}`).toString("base64")}`;

/** Runs fn so every LLM span inside it is attributed to this user in Langfuse (needed for per-user deletion). */
export function traced<T>(userId: string, traceName: string, fn: () => Promise<T>): Promise<T> {
  return propagateAttributes({ userId, traceName }, fn);
}

/**
 * Deletes every Langfuse trace attributed to this user. Traces hold prompt inputs
 * (transcripts, samples, tasks) and outputs. Best effort: logs and returns on failure.
 */
export async function deleteUserTraces(userId: string): Promise<{ deleted: number }> {
  if (!process.env.LANGFUSE_SECRET_KEY || !process.env.LANGFUSE_PUBLIC_KEY) return { deleted: 0 };
  const headers = { Authorization: authHeader(), "Content-Type": "application/json" };
  try {
    // Langfuse Cloud removed GET /api/public/traces (v3) on 2026-11-16; v2 observations carry traceId.
    const ids = new Set<string>();
    let cursor: string | undefined;
    for (let page = 0; page < 100; page++) {
      const url = new URL(`${baseUrl()}/api/public/v2/observations`);
      url.searchParams.set("fields", "core");
      url.searchParams.set("userId", userId);
      url.searchParams.set("fromStartTime", "2020-01-01T00:00:00Z");
      url.searchParams.set("toStartTime", new Date().toISOString());
      url.searchParams.set("limit", "1000");
      if (cursor) url.searchParams.set("cursor", cursor);
      const res = await fetch(url, { headers, cache: "no-store" });
      if (!res.ok) throw new Error(`list observations: ${res.status}`);
      const body = (await res.json()) as { data: { traceId?: string }[]; meta?: { cursor?: string | null } };
      for (const o of body.data) if (o.traceId) ids.add(o.traceId);
      cursor = body.meta?.cursor ?? undefined;
      if (!cursor || !body.data.length) break;
    }
    if (ids.size) {
      // Needs an API key with the traces:delete permission.
      const res = await fetch(`${baseUrl()}/api/public/traces`, { method: "DELETE", headers, body: JSON.stringify({ traceIds: [...ids] }) });
      if (!res.ok) throw new Error(`delete traces: ${res.status}`);
    }
    return { deleted: ids.size };
  } catch (e) {
    console.error("Langfuse trace deletion failed", e instanceof Error ? e.message : e);
    return { deleted: 0 };
  }
}
