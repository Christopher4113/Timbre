import Link from "next/link";
import { SampleEditor } from "@/components/samples/sample-editor";
import { listSamples } from "@/lib/db/queries";
import { requireConsentedUser } from "@/lib/session";
import { btnPrimary, btnQuiet, card, h1 } from "@/lib/ui";
import { MAX_SAMPLES, MIN_SAMPLES } from "@/lib/samples";
import { deleteSampleAction, startBuildAction } from "./actions";

export const maxDuration = 300; // the profile build runs after this action's response

const ERRORS: Record<string, string> = {
  too_few: `Add at least ${MIN_SAMPLES} samples first.`,
  rate_limited: "You've built several profiles today. Try again tomorrow.",
};

export default async function SamplesPage({ searchParams }: PageProps<"/samples">) {
  const user = await requireConsentedUser();
  const samples = await listSamples(user.id);
  const { error } = await searchParams;
  const ready = samples.length >= MIN_SAMPLES;

  return (
    <div className="space-y-8">
      <div>
        <h1 className={h1}>Writing samples</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Paste {MIN_SAMPLES} to {MAX_SAMPLES} things you wrote yourself. A mix works best: a couple of professional messages and a couple of casual ones. Remove anything private first. Samples are sent to our AI model provider to build your profile.
        </p>
      </div>

      {typeof error === "string" && ERRORS[error] && (
        <p role="alert" className="rounded-[10px] border border-ember/40 px-4 py-3 text-sm text-ink">{ERRORS[error]}</p>
      )}

      <SampleEditor disabled={samples.length >= MAX_SAMPLES} />

      <section aria-labelledby="your-samples">
        <div className="flex items-baseline justify-between">
          <h2 id="your-samples" className="text-lg font-medium text-ink">Your samples</h2>
          <span className="text-sm text-muted">{samples.length} of {MAX_SAMPLES}</span>
        </div>
        {samples.length === 0 ? (
          <p className="mt-3 text-muted">Nothing yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {samples.map((s) => (
              <li key={s.id} className={`${card} p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-muted">{s.context}{s.aiDraft ? " · with AI draft" : ""}</span>
                  <form action={deleteSampleAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className={btnQuiet}>Delete</button>
                  </form>
                </div>
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-[15px] text-ink">{s.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={startBuildAction} className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <button type="submit" disabled={!ready} className={btnPrimary}>Build my profile</button>
        <p className="text-sm text-muted">
          {ready ? "Takes about a minute." : `Add ${MIN_SAMPLES - samples.length} more to continue.`}{" "}
          <Link href="/onboarding" className="underline underline-offset-2">Back to steps</Link>
        </p>
      </form>
    </div>
  );
}
