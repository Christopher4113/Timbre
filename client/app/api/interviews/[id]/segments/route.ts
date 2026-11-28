import { z } from "zod";
import { saveSegments } from "@/lib/db/queries";
import { Segment } from "@/lib/interview";
import { apiUser } from "@/lib/session";

export async function POST(req: Request, ctx: RouteContext<"/api/interviews/[id]/segments">) {
  const auth = await apiUser();
  if ("error" in auth) return auth.error;
  const id = z.uuid().safeParse((await ctx.params).id);
  const body = z.object({ segments: z.array(Segment).max(50) }).safeParse(await req.json().catch(() => null));
  if (!id.success || !body.success) return Response.json({ error: "bad_request" }, { status: 400 });
  await saveSegments(auth.user.id, id.data, body.data.segments);
  return Response.json({ ok: true });
}
