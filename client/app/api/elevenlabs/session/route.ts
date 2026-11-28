import { getSignedUrl } from "@/lib/elevenlabs";
import { apiUser } from "@/lib/session";

/** Starts an interview: a signed URL for the private agent, for the signed-in user only. */
export async function GET() {
  const auth = await apiUser("interview");
  if ("error" in auth) return auth.error;
  try {
    return Response.json({ signedUrl: await getSignedUrl() }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "voice_unavailable" }, { status: 502 });
  }
}
