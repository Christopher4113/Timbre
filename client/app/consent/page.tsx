import { redirect } from "next/navigation";
import { Wordmark } from "@/components/wordmark";
import { getLatestConsent, recordConsent } from "@/lib/db/queries";
import { CONSENT_VERSION, requireUser } from "@/lib/session";

const SCOPES = {
  recording: "Timbre records a voice interview of about 10 minutes. Audio is used only for live transcription and is never stored.",
  transcription: "Your answers are transcribed and the transcript is saved to your account.",
  modelProviders: "Your transcript and writing samples are sent to an AI model provider (Anthropic or OpenAI) to build your profile and to write playground drafts.",
  retention: "Transcripts, samples and profiles stay until you delete them. You can delete each one, or your whole account, from settings.",
} as const;

async function accept() {
  "use server";
  const user = await requireUser();
  await recordConsent(user.id, CONSENT_VERSION, Object.fromEntries(Object.keys(SCOPES).map((k) => [k, true])));
  redirect("/onboarding");
}

export default async function ConsentPage() {
  const user = await requireUser();
  if ((await getLatestConsent(user.id))?.version === CONSENT_VERSION) redirect("/onboarding");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-8">
      <Wordmark />
      <h1 className="mt-12 font-display text-[32px] font-normal tracking-[-0.02em] text-ink sm:text-[40px]">Before we start</h1>
      <p className="mt-3 text-muted">Here is exactly what Timbre does with your data. Version {CONSENT_VERSION}.</p>
      <ul className="mt-8 space-y-5">
        {Object.entries(SCOPES).map(([key, text]) => (
          <li key={key} className="rounded-[14px] border border-line bg-surface p-5 leading-relaxed text-ink">{text}</li>
        ))}
      </ul>
      <form action={accept} className="mt-8 space-y-5">
        <label className="flex items-start gap-3 text-ink">
          <input type="checkbox" name="agree" required className="mt-1 size-4 accent-[var(--ember)]" />
          <span>I understand and agree to the above.</span>
        </label>
        <button type="submit" className="min-h-11 cursor-pointer rounded-[10px] bg-ember px-6 font-medium text-ember-ink hover:opacity-90">
          Continue
        </button>
      </form>
    </div>
  );
}
