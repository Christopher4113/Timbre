"use client";

import { useActionState, useState } from "react";
import { addSampleAction, type ActionState } from "@/app/(app)/samples/actions";
import { btnPrimary, btnQuiet, card, field } from "@/lib/ui";

const CONTEXTS = [
  ["outreach", "Outreach"],
  ["application", "Application"],
  ["casual", "Casual"],
  ["technical", "Technical"],
  ["other", "Other"],
] as const;

export function SampleEditor({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addSampleAction, {});
  // Remount the form after each successful add to clear it.
  return <SampleForm key={state.ok ?? 0} action={action} pending={pending} disabled={disabled} error={state.error} />;
}

function SampleForm(props: { action: (f: FormData) => void; pending: boolean; disabled: boolean; error?: string }) {
  const { action, pending, disabled } = props;
  const [withDraft, setWithDraft] = useState(false);

  return (
    <form action={action} className={`${card} space-y-4 p-5`}>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">What kind of writing is this?</legend>
        <div className="flex flex-wrap gap-2">
          {CONTEXTS.map(([value, label], i) => (
            <label key={value} className="cursor-pointer">
              <input type="radio" name="context" value={value} defaultChecked={i === 0} className="peer sr-only" />
              <span className="inline-block rounded-full border border-line px-3.5 py-1.5 text-sm text-muted peer-checked:border-ember peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-ember">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {withDraft && (
        <div>
          <label htmlFor="aiDraft" className="mb-2 block text-sm font-medium text-ink">AI draft</label>
          <textarea id="aiDraft" name="aiDraft" rows={4} maxLength={8000} className={field} placeholder="What ChatGPT or Claude gave you" />
        </div>
      )}

      <div>
        <label htmlFor="text" className="mb-2 block text-sm font-medium text-ink">
          {withDraft ? "What you actually sent" : "Something you wrote"}
        </label>
        <textarea id="text" name="text" rows={7} required minLength={20} maxLength={8000} className={field} placeholder="Paste an email, message or cover letter you wrote yourself." />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={btnQuiet} onClick={() => setWithDraft((v) => !v)}>
          {withDraft ? "Remove AI draft" : "I also have the AI draft I rewrote"}
        </button>
        <button type="submit" disabled={pending || disabled} className={btnPrimary}>
          {pending ? "Saving..." : "Add sample"}
        </button>
      </div>
      {props.error && <p role="alert" className="text-sm text-ember">{props.error}</p>}
    </form>
  );
}
