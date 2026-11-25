import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

// Model ids come from env as "provider:model", e.g. "anthropic:claude-opus-5-5".
const DEFAULT_MODEL = "anthropic:claude-opus-5-5";

export function modelFromEnv(kind: "extract" | "generate"): { model: LanguageModel; id: string } {
  const id = (kind === "extract" ? process.env.EXTRACT_MODEL : process.env.GENERATE_MODEL)?.trim() || DEFAULT_MODEL;
  const [provider, ...rest] = id.split(":");
  const name = rest.join(":");
  if (!name) throw new Error(`Bad model id "${id}". Use provider:model, e.g. ${DEFAULT_MODEL}`);
  if (provider === "anthropic") return { model: anthropic(name), id };
  if (provider === "openai") return { model: openai(name), id };
  throw new Error(`Unknown provider "${provider}" in "${id}"`);
}

/**
 * Shared call settings. No temperature: current Claude models reject sampling params.
 * Anthropic-only options are ignored by other providers.
 */
export function callSettings(kind: "extract" | "generate") {
  return {
    maxOutputTokens: 16_000,
    maxRetries: 2,
    providerOptions: {
      anthropic: {
        effort: kind === "extract" ? "high" : "medium",
        fallbacks: "default", // re-run on a fallback model if the request is declined
      },
    },
  } as const;
}
