import Link from "next/link";
import { countSamples, getActiveJob, getLatestInterview, getLatestProfile } from "@/lib/db/queries";
import { MIN_SAMPLES } from "@/lib/samples";
import { requireConsentedUser } from "@/lib/session";
import { card, h1 } from "@/lib/ui";

type Step = { title: string; detail: string; state: "done" | "next" | "running" | "locked" | "soon"; href?: string };

export default async function OnboardingPage() {
  const user = await requireConsentedUser();
  const [samples, profile, job, interview] = await Promise.all([countSamples(user.id), getLatestProfile(user.id), getActiveJob(user.id), getLatestInterview(user.id)]);
  const hasSamples = samples >= MIN_SAMPLES;

  const steps: Step[] = [
    interview?.status === "ready"
      ? { title: "Voice interview", detail: "Transcript saved", state: "done", href: "/interview" }
      : interview
        ? { title: "Voice interview", detail: "Processing your transcript", state: "running", href: "/interview" }
        : { title: "Voice interview", detail: "About 10 minutes", state: "next", href: "/interview" },
    { title: "Writing samples", detail: `${samples} added, ${MIN_SAMPLES} to 10 needed`, state: hasSamples ? "done" : "next", href: "/samples" },
    job
      ? { title: "Build profile", detail: "Building now", state: "running", href: `/building?job=${job.id}` }
      : { title: "Build profile", detail: "Runs in about a minute", state: profile ? "done" : hasSamples ? "next" : "locked", href: hasSamples ? "/samples" : undefined },
    { title: "Review rules", detail: "Keep, edit or delete", state: profile ? (profile.version > 1 ? "done" : "next") : "locked", href: profile ? "/review" : undefined },
    { title: "Playground", detail: "Blind side-by-side. Coming soon", state: "soon" },
    { title: "Export", detail: "SKILL.md and ChatGPT block", state: profile ? "next" : "locked", href: profile ? "/export" : undefined },
  ];

  const LABEL: Record<Step["state"], string> = { done: "Done", next: "Start", running: "In progress", locked: "Not yet", soon: "Soon" };

  return (
    <div>
      <h1 className={h1}>Your voice profile</h1>
      <p className="mt-2 text-muted">Six steps. You can stop and come back any time.</p>
      <ol aria-label="Onboarding progress" className={`${card} mt-10 divide-y divide-line`}>
        {steps.map((s, i) => {
          const body = (
            <>
              <span className="font-mono text-[13px] text-ember">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex-1">
                <p className="font-medium text-ink">{s.title}</p>
                <p className="text-sm text-muted">{s.detail}</p>
              </div>
              <span className={`text-[13px] ${s.state === "done" ? "text-moss" : s.state === "next" || s.state === "running" ? "text-ember" : "text-muted"}`}>
                {LABEL[s.state]}
              </span>
            </>
          );
          return (
            <li key={s.title}>
              {s.href ? (
                <Link href={s.href} className="flex items-center gap-5 px-5 py-4 hover:bg-paper">{body}</Link>
              ) : (
                <div className="flex items-center gap-5 px-5 py-4 opacity-70">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
