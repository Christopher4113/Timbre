const STEPS = [
  { title: "Voice interview", detail: "About 10 minutes" },
  { title: "Writing samples", detail: "3 to 10 pieces" },
  { title: "Build profile", detail: "Runs in the background" },
  { title: "Review rules", detail: "Keep, edit or delete" },
  { title: "Playground", detail: "Blind side-by-side" },
  { title: "Export", detail: "SKILL.md and ChatGPT block" },
];

export default function OnboardingPage() {
  return (
    <div>
      <h1 className="font-display text-[32px] font-normal tracking-[-0.02em] text-ink">Your voice profile</h1>
      <p className="mt-2 text-muted">Six steps. You can stop and come back any time.</p>
      <ol aria-label="Onboarding progress" className="mt-10 divide-y divide-line rounded-[14px] border border-line bg-surface">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex items-center gap-5 px-5 py-4">
            <span className="font-mono text-[13px] text-ember">{String(i + 1).padStart(2, "0")}</span>
            <div className="flex-1">
              <p className="font-medium text-ink">{s.title}</p>
              <p className="text-sm text-muted">{s.detail}</p>
            </div>
            <span className="text-[13px] text-muted">{i === 0 ? "Up next" : "Not started"}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
