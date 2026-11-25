import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { Resend } from "resend";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

async function sendMagicLink({ email, url }: { email: string; url: string }) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not set");
    console.log(`[dev] magic link for ${email}: ${url}`);
    return;
  }
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: "Your Timbre sign-in link",
    text: `Sign in to Timbre: ${url}\n\nThis link expires in 10 minutes. If you did not ask for it, ignore this email.`,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", usePlural: true, schema }),
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  rateLimit: {
    enabled: true,
    storage: "database", // serverless instances don't share memory
    window: 60,
    max: 60,
  },
  plugins: [
    magicLink({ expiresIn: 60 * 10, rateLimit: { window: 60 * 10, max: 3 }, sendMagicLink }),
    nextCookies(), // must be last
  ],
});
