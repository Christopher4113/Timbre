"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { saveProfileAction } from "@/app/(app)/review/actions";
import type { Context, Rule, VoiceProfile } from "@/lib/schema";
import { btnPrimary, btnQuiet, btnSecondary, card, field } from "@/lib/ui";

const GROUPS: [Context, string][] = [
  ["general", "General"],
  ["outreach", "Outreach"],
  ["application", "Applications"],
  ["casual", "Casual"],
  ["technical", "Technical"],
];
const SOURCE: Record<Rule["source"], string> = { speech: "from your interview", writing: "from your writing", both: "from interview and writing" };

export function ReviewEditor({ initial, version }: { initial: VoiceProfile; version: number }) {
  const [saved, setSaved] = useState({ profile: initial, version });
  const [summary, setSummary] = useState(initial.summary);
  const [rules, setRules] = useState(initial.rules);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = useMemo(
    () => summary !== saved.profile.summary || JSON.stringify(rules) !== JSON.stringify(saved.profile.rules),
    [summary, rules, saved],
  );

  const update = (id: string, patch: Partial<Rule>) => setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  function save() {
    const next: VoiceProfile = { ...saved.profile, summary: summary.trim(), rules };
    startTransition(async () => {
      const res = await saveProfileAction(next);
      if (res.error) return setMessage({ kind: "error", text: res.error });
      setSaved({ profile: next, version: res.version! });
      setMessage({ kind: "ok", text: `Saved as version ${res.version}.` });
    });
  }

  function discard() {
    setSummary(saved.profile.summary);
    setRules(saved.profile.rules);
    setEditing(null);
    setMessage(null);
  }

  return (
    <div className="space-y-10 pb-28">
      <section aria-labelledby="summary-h">
        <h2 id="summary-h" className="text-lg font-medium text-ink">Summary</h2>
        <textarea
          aria-label="Profile summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          maxLength={1200}
          className={`${field} mt-3 leading-relaxed`}
        />
      </section>

      {GROUPS.map(([ctx, title]) => {
        const group = rules.filter((r) => r.context === ctx);
        if (!group.length) return null;
        return (
          <section key={ctx} aria-labelledby={`g-${ctx}`}>
            <h2 id={`g-${ctx}`} className="text-lg font-medium text-ink">{title}</h2>
            <ul className="mt-3 space-y-3">
              {group.map((r) => (
                <RuleCard
                  key={r.id}
                  rule={r}
                  editing={editing === r.id}
                  onEdit={() => setEditing(r.id)}
                  onDone={(text) => {
                    const t = text.trim();
                    if (t.length >= 5 && t !== r.rule) update(r.id, { rule: t, status: "edited" });
                    setEditing(null);
                  }}
                  onKeep={() => update(r.id, { status: r.status === "inferred" ? "approved" : r.status === "approved" ? "inferred" : r.status })}
                  onDelete={() => setRules((rs) => rs.filter((x) => x.id !== r.id))}
                />
              ))}
            </ul>
          </section>
        );
      })}

      {rules.length === 0 && <p className="text-muted">You deleted every rule. Save to keep it that way, or discard to get them back.</p>}

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <p role="status" className={`text-sm ${message?.kind === "error" ? "text-ember" : "text-muted"}`}>
            {message?.text ?? (dirty ? "Unsaved changes" : `Version ${saved.version}`)}
          </p>
          <div className="flex gap-2">
            {dirty ? (
              <>
                <button type="button" onClick={discard} className={btnSecondary} disabled={pending}>Discard</button>
                <button type="button" onClick={save} className={btnPrimary} disabled={pending}>
                  {pending ? "Saving..." : `Save as version ${saved.version + 1}`}
                </button>
              </>
            ) : (
              <Link href="/export" className={btnPrimary}>Export</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RuleCard(props: {
  rule: Rule;
  editing: boolean;
  onEdit: () => void;
  onDone: (text: string) => void;
  onKeep: () => void;
  onDelete: () => void;
}) {
  const { rule: r, editing } = props;
  const [draft, setDraft] = useState(r.rule);

  return (
    <li className={`${card} p-5 ${r.status !== "inferred" ? "border-moss/50" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
        <span>{r.category.replace(/_/g, " ")} · {SOURCE[r.source]}</span>
        <ConfidenceBadge level={r.confidence} />
        {r.status === "approved" && <span className="text-moss">Kept</span>}
        {r.status === "edited" && <span className="text-moss">Edited</span>}
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          <label htmlFor={`edit-${r.id}`} className="sr-only">Edit rule</label>
          <textarea id={`edit-${r.id}`} value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} maxLength={400} autoFocus className={field} />
          <button type="button" onClick={() => props.onDone(draft)} className={btnSecondary}>Done</button>
        </div>
      ) : (
        <p className="mt-2 text-[17px] leading-snug text-ink">{r.rule}</p>
      )}

      <ul aria-label="Evidence from your own words" className="mt-3 space-y-1.5">
        {r.evidence.map((q) => (
          <li key={q} className="border-l-2 border-ember/50 pl-3 font-mono text-[13px] text-muted">&ldquo;{q}&rdquo;</li>
        ))}
      </ul>

      {!editing && (
        <div className="mt-3 flex gap-1">
          <button type="button" onClick={props.onKeep} className={btnQuiet} aria-pressed={r.status === "approved"}>
            {r.status === "approved" ? "Kept" : "Keep"}
          </button>
          <button type="button" onClick={() => { setDraft(r.rule); props.onEdit(); }} className={btnQuiet}>Edit</button>
          <button type="button" onClick={props.onDelete} className={btnQuiet}>Delete</button>
        </div>
      )}
    </li>
  );
}

function ConfidenceBadge({ level }: { level: Rule["confidence"] }) {
  const tone = level === "high" ? "border-moss/40 text-moss" : level === "medium" ? "border-line text-ink" : "border-line text-muted";
  return <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 ${tone}`}>{level} confidence</span>;
}
