"use client";

import Link from "next/link";
import { useState } from "react";
import { btnPrimary, btnSecondary, card, field } from "@/lib/ui";

type Side = "left" | "right";
type Result = { id: string; left: string; right: string };

const ERRORS: Record<number, string> = {
  409: "Build a profile first.",
  429: "You've generated a lot in the last hour. Try again later.",
  502: "The model didn't respond. Try again.",
};

async function patch(id: string, body: object) {
  const res = await fetch(`/api/comparisons/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as { editDistance?: number };
}

export function Playground() {
  const [task, setTask] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [picked, setPicked] = useState<Side | null>(null);
  const [sendAsIs, setSendAsIs] = useState<boolean | null>(null);
  const [edit, setEdit] = useState("");
  const [saved, setSaved] = useState(false);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task }) }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError(ERRORS[res?.status ?? 502] ?? "Something went wrong. Try again.");
    setResult(await res.json());
  }

  async function pick(side: Side) {
    if (!result || picked) return;
    setPicked(side);
    setEdit(result[side]);
    await patch(result.id, { picked: side }).catch(() => setError("Couldn't save your pick. Try again."));
  }

  async function answer(value: boolean) {
    if (!result) return;
    setSendAsIs(value);
    await patch(result.id, { sendAsIs: value }).catch(() => setError("Couldn't save that. Try again."));
  }

  async function saveEdit() {
    if (!result) return;
    await patch(result.id, { editedText: edit })
      .then(() => setSaved(true))
      .catch(() => setError("Couldn't save your edit. Try again."));
  }

  function reset() {
    setResult(null);
    setPicked(null);
    setSendAsIs(null);
    setEdit("");
    setSaved(false);
    setError(null);
    setTask("");
  }

  if (!result) {
    return (
      <form onSubmit={generate} className={`${card} space-y-4 p-5`}>
        <label htmlFor="task" className="block text-sm font-medium text-ink">What do you need to write?</label>
        <textarea
          id="task"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={5}
          required
          minLength={10}
          maxLength={4000}
          className={field}
          placeholder="e.g. Write a LinkedIn message to a founder whose post about onboarding I liked, asking for a 15 minute chat."
        />
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Writing two drafts..." : "Write two drafts"}</button>
          {busy && <span role="status" className="text-sm text-muted">Usually 10 to 20 seconds.</span>}
        </div>
        {error && (
          <p role="alert" className="text-sm text-ember">
            {error} {error === ERRORS[409] && <Link href="/samples" className="underline underline-offset-2">Add samples</Link>}
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted"><span className="text-ink">Task:</span> {task}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {(["left", "right"] as const).map((side, i) => {
          const isPicked = picked === side;
          return (
            <article
              key={side}
              aria-label={`Draft ${i ? "B" : "A"}`}
              className={`${card} flex flex-col p-5 ${isPicked ? "border-2 border-ember" : picked ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between text-[13px] text-muted">
                <span>Draft {i ? "B" : "A"}</span>
                {isPicked && <span className="text-ember">Your pick</span>}
              </div>
              <p className="mt-3 flex-1 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{result[side]}</p>
              {!picked && (
                <button type="button" onClick={() => pick(side)} className={`${btnSecondary} mt-4`}>
                  This sounds more like me
                </button>
              )}
            </article>
          );
        })}
      </div>

      {picked && sendAsIs === null && (
        <div className={`${card} flex flex-wrap items-center justify-between gap-3 p-5`}>
          <p className="text-ink">Would you send your pick as it is?</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => answer(true)} className={btnSecondary}>Yes, as is</button>
            <button type="button" onClick={() => answer(false)} className={btnSecondary}>No, I&rsquo;d change it</button>
          </div>
        </div>
      )}

      {picked && sendAsIs === false && (
        <div className={`${card} space-y-3 p-5`}>
          <label htmlFor="edit" className="block text-sm font-medium text-ink">Edit it into what you&rsquo;d actually send</label>
          <textarea id="edit" value={edit} onChange={(e) => { setEdit(e.target.value); setSaved(false); }} rows={8} maxLength={8000} className={field} />
          <div className="flex items-center gap-3">
            <button type="button" onClick={saveEdit} className={btnPrimary} disabled={saved}>{saved ? "Saved" : "Save edit"}</button>
            <span className="text-sm text-muted">Your edits are logged to measure how close the drafts get. They don&rsquo;t change your profile.</span>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-ember">{error}</p>}

      {picked && (sendAsIs === true || saved) && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="status" className="text-muted">Thanks, that&rsquo;s logged.</p>
          <button type="button" onClick={reset} className={btnPrimary}>Try another task</button>
        </div>
      )}
    </div>
  );
}
