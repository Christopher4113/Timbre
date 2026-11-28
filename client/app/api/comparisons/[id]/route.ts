import { z } from "zod";
import { getComparison, updateComparison } from "@/lib/db/queries";
import { editDistance } from "@/lib/metrics";
import { apiUser } from "@/lib/session";

const Body = z
  .object({
    picked: z.enum(["left", "right"]).optional(),
    sendAsIs: z.boolean().optional(),
    editedText: z.string().max(8000).optional(),
  })
  .refine((b) => Object.keys(b).length > 0);

/** Records the blind pick, "send as-is?", and an optional edit of the winner. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/comparisons/[id]">) {
  const auth = await apiUser();
  if ("error" in auth) return auth.error;
  const id = z.uuid().safeParse((await ctx.params).id);
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!id.success || !body.success) return Response.json({ error: "bad_request" }, { status: 400 });

  const row = await getComparison(auth.user.id, id.data);
  if (!row) return Response.json({ error: "not_found" }, { status: 404 });

  const other = (s: "baseline" | "profile") => (s === "baseline" ? "profile" : "baseline");
  const picked = body.data.picked ? (body.data.picked === "left" ? row.leftIs : other(row.leftIs)) : row.picked;
  // The pick is the measurement: it can be made once, not changed.
  if (body.data.picked && row.picked && row.picked !== picked) return Response.json({ error: "already_picked" }, { status: 409 });
  if (!picked && (body.data.sendAsIs !== undefined || body.data.editedText !== undefined)) {
    return Response.json({ error: "pick_first" }, { status: 409 });
  }

  const patch: Parameters<typeof updateComparison>[2] = { picked };
  if (body.data.sendAsIs !== undefined) patch.sendAsIs = body.data.sendAsIs;
  if (body.data.editedText !== undefined) {
    const winner = picked === "baseline" ? row.baselineOutput : row.profileOutput;
    patch.editedText = body.data.editedText;
    patch.editDistance = editDistance(winner, body.data.editedText);
  }
  await updateComparison(auth.user.id, row.id, patch);
  return Response.json({ ok: true, editDistance: patch.editDistance });
}
