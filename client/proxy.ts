import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Optimistic gate: bounces requests with no session cookie before they render.
// Real checks (session in DB, consent, rate limits) happen in lib/session.ts.
const PUBLIC_API = ["/api/auth", "/api/webhooks", "/api/inngest"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_API.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (getSessionCookie(req)) return NextResponse.next();

  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL("/", req.url);
  url.searchParams.set("signin", "1");
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except the landing page, Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|webp|txt)$|$).+)"],
};
