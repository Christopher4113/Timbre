import { z } from "zod";
import { registerInterview } from "@/lib/db/queries";
import { apiUser } from "@/lib/session";

const Body = z.object({ conversationId: z.string().min(1).max(128).regex(/^[\w-]+$/) });

/** Ties a new ElevenLabs conversation to the signed-in user so the webhook can find its owner. */
export async function POST(req: Request) {
  const auth = await apiUser();
  if ("error" in auth) return auth.error;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const row = await registerInterview(auth.user.id, body.data.conversationId);
  if (!row) return Response.json({ error: "conflict" }, { status: 409 });
  return Response.json({ id: row.id });
}
