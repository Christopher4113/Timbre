import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "@/lib/elevenlabs";
import { toTurns } from "@/lib/interview";

const secret = "wsec_test";
const body = JSON.stringify({ type: "post_call_transcription", data: { conversation_id: "c1" } });
const sign = (t: number, b = body, s = secret) => `t=${t},v0=${createHmac("sha256", s).update(`${t}.${b}`).digest("hex")}`;
const now = 1_800_000_000;

describe("verifyWebhookSignature", () => {
  it("accepts a valid signature", () => expect(verifyWebhookSignature(body, sign(now), secret, now)).toBe(true));
  it("rejects a tampered body", () => expect(verifyWebhookSignature(body + " ", sign(now), secret, now)).toBe(false));
  it("rejects the wrong secret", () => expect(verifyWebhookSignature(body, sign(now, body, "other"), secret, now)).toBe(false));
  it("rejects stale timestamps (replay)", () => expect(verifyWebhookSignature(body, sign(now - 3600), secret, now)).toBe(false));
  it("rejects missing or malformed headers", () => {
    expect(verifyWebhookSignature(body, null, secret, now)).toBe(false);
    expect(verifyWebhookSignature(body, "garbage", secret, now)).toBe(false);
    expect(verifyWebhookSignature(body, `t=${now},v0=abc`, secret, now)).toBe(false);
  });
  it("rejects when no secret is configured", () => expect(verifyWebhookSignature(body, sign(now, body, ""), "", now)).toBe(false));
});

describe("toTurns", () => {
  it("labels turns with the latest scenario switch", () => {
    const turns = toTurns(
      [
        { role: "agent", text: "Hi, ready?", timeSec: 0 },
        { role: "user", text: "Yep", timeSec: 3 },
        { role: "agent", text: "Introduce yourself", timeSec: 6 },
        { role: "user", text: "I'm reaching out because", timeSec: 9 },
        { role: "user", text: "So imagine a phone book", timeSec: 70 },
      ],
      [{ name: "explain_technical", atSec: 60 }, { name: "introduce_founder", atSec: 5 }],
    );
    expect(turns.map((t) => t.scenario)).toEqual([null, null, "introduce_founder", "introduce_founder", "explain_technical"]);
  });

  it("tolerates missing or invalid data", () => {
    expect(toTurns(null, null)).toEqual([]);
    expect(toTurns([{ role: "user", text: "hi", timeSec: 1 }], "nope")).toEqual([{ role: "user", text: "hi", scenario: null }]);
  });
});
