import { getLatestProfile } from "@/lib/db/queries";
import { renderCustomInstructions } from "@/lib/export/custom-instructions";
import { renderSkillMd } from "@/lib/export/skill-md";
import { VoiceProfile } from "@/lib/schema";
import { apiUser, displayName } from "@/lib/session";

export async function GET(_req: Request, ctx: RouteContext<"/api/export/[format]">) {
  const auth = await apiUser();
  if ("error" in auth) return auth.error;
  const { format } = await ctx.params;
  const row = await getLatestProfile(auth.user.id);
  if (!row) return Response.json({ error: "no_profile" }, { status: 404 });
  const profile = VoiceProfile.parse(row.data);

  if (format === "skill-md") {
    return new Response(renderSkillMd(profile, displayName(auth.user)), {
      headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": 'attachment; filename="SKILL.md"' },
    });
  }
  if (format === "custom-instructions") {
    return new Response(renderCustomInstructions(profile), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  return Response.json({ error: "unknown_format" }, { status: 404 });
}
