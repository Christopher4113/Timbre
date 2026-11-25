import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(".env.local"); // drizzle-kit does not read Next env files
} catch {}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
