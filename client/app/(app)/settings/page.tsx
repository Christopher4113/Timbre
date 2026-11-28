import { ConfirmButton } from "@/components/settings/confirm-button";
import { getDataCounts, listConsents } from "@/lib/db/queries";
import { requireConsentedUser } from "@/lib/session";
import { card, h1 } from "@/lib/ui";
import { deleteAccountAction, deleteProfilesAction, deleteSamplesAction, deleteTranscriptsAction } from "./actions";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export default async function SettingsPage() {
  const user = await requireConsentedUser();
  const [counts, consents] = await Promise.all([getDataCounts(user.id), listConsents(user.id)]);

  const rows = [
    {
      title: "Interview transcripts",
      detail: `${plural(counts.interviews, "transcript")}. Also deletes ElevenLabs' copy. Your profile is not changed until you rebuild it.`,
      action: deleteTranscriptsAction,
      empty: counts.interviews === 0,
    },
    {
      title: "Writing samples",
      detail: `${plural(counts.samples, "sample")}. Your profile is not changed until you rebuild it.`,
      action: deleteSamplesAction,
      empty: counts.samples === 0,
    },
    {
      title: "Voice profiles",
      detail: `${plural(counts.profiles, "version")} and ${plural(counts.comparisons, "playground comparison")} made with them.`,
      action: deleteProfilesAction,
      empty: counts.profiles === 0,
    },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className={h1}>Settings</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Signed in as {user.email}. Transcripts and samples are sent to our AI model provider (Anthropic) only to build your profile and write playground drafts. Audio is never stored. Every delete here also removes the matching AI request logs (traces). Deleting is permanent.
        </p>
      </div>

      <section aria-labelledby="data-h" className="space-y-3">
        <h2 id="data-h" className="text-lg font-medium text-ink">Your data</h2>
        <ul className={`${card} divide-y divide-line`}>
          {rows.map((r) => (
            <li key={r.title} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="max-w-xl">
                <p className="font-medium text-ink">{r.title}</p>
                <p className="text-sm text-muted">{r.detail}</p>
              </div>
              {r.empty ? <span className="text-sm text-muted">Nothing to delete</span> : <ConfirmButton action={r.action} label="Delete" confirm="Delete permanently" />}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="consent-h" className="space-y-3">
        <h2 id="consent-h" className="text-lg font-medium text-ink">Consent history</h2>
        <ul className={`${card} divide-y divide-line text-sm`}>
          {consents.map((c) => (
            <li key={c.id} className="flex justify-between gap-4 px-5 py-3">
              <span className="text-ink">Version {c.version}</span>
              <time dateTime={c.acceptedAt.toISOString()} className="text-muted">{c.acceptedAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</time>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="account-h" className="space-y-3">
        <h2 id="account-h" className="text-lg font-medium text-ink">Delete account</h2>
        <div className={`${card} flex flex-wrap items-center justify-between gap-4 border-ember/40 p-5`}>
          <p className="max-w-xl text-sm text-muted">Deletes your account and everything in it: transcripts, samples, profiles, playground history and consent records. This can&rsquo;t be undone.</p>
          <ConfirmButton action={deleteAccountAction} label="Delete account" confirm="Yes, delete everything" />
        </div>
      </section>
    </div>
  );
}
