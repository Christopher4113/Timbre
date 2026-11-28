// Langfuse tracing for every AI SDK call. Off unless LANGFUSE_SECRET_KEY is set.
// Uses a plain NodeTracerProvider (as Langfuse's Next.js guide does) rather than
// @vercel/otel, whose sampler dropped the AI SDK spans inside Next route handlers.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.LANGFUSE_SECRET_KEY) return;

  const [{ NodeTracerProvider }, { LangfuseSpanProcessor }, { registerTelemetry }, { OpenTelemetry }] = await Promise.all([
    import("@opentelemetry/sdk-trace-node"),
    import("@langfuse/otel"),
    import("ai"),
    import("@ai-sdk/otel"),
  ]);

  new NodeTracerProvider({
    spanProcessors: [
      new LangfuseSpanProcessor({
        baseUrl: process.env.LANGFUSE_BASE_URL ?? process.env.LANGFUSE_HOST,
        // Serverless functions can freeze before a batch flushes; send each span as it ends.
        exportMode: "immediate",
      }),
    ],
  }).register();
  registerTelemetry(new OpenTelemetry());
}
