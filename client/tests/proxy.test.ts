import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

const req = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost${path}`, { headers: cookie ? { cookie } : {} });

describe("proxy auth gate", () => {
  it("redirects signed-out page requests to the landing page", () => {
    const res = proxy(req("/onboarding"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/?signin=1");
  });

  it("returns 401 for signed-out API requests", () => {
    expect(proxy(req("/api/generate")).status).toBe(401);
  });

  it("lets auth and webhook routes through", () => {
    expect(proxy(req("/api/auth/sign-in/magic-link")).headers.get("x-middleware-next")).toBe("1");
    expect(proxy(req("/api/webhooks/elevenlabs")).headers.get("x-middleware-next")).toBe("1");
  });

  it("lets requests with a session cookie through", () => {
    expect(proxy(req("/onboarding", "better-auth.session_token=abc")).headers.get("x-middleware-next")).toBe("1");
  });
});
