import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": root("."), "server-only": root("tests/empty.ts") } },
  test: { include: ["tests/**/*.test.ts"], testTimeout: 20_000 },
});
