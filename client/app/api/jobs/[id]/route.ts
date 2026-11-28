import { z } from "zod";
import { getJob } from "@/lib/db/queries";
import { apiUser } from "@/lib/session";

export async function GET(_req: Request, ctx: RouteContext<"/api/jobs/[id]">) {
  const auth = await apiUser();
  if ("error" in auth) return auth.error;
  const id = z.uuid().safeParse((await ctx.params).id);
  if (!id.success) return Response.json({ error: "not_found" }, { status: 404 });
  const job = await getJob(auth.user.id, id.data);
  if (!job) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ status: job.status, error: job.error });
}
