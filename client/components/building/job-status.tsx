"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { btnPrimary } from "@/lib/ui";

type Job = { status: "running" | "done" | "failed"; error?: string | null };

export function JobStatus({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<Job>({ status: "running" });
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let stopped = false;
    const started = Date.now();
    async function poll() {
      while (!stopped) {
        const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" }).catch(() => null);
        if (res?.ok) {
          const next: Job = await res.json();
          setJob(next);
          if (next.status === "done") return router.push("/review");
          if (next.status === "failed") return;
        } else if (res?.status === 404) {
          return setJob({ status: "failed", error: "We couldn't find that build." });
        }
        setSeconds(Math.round((Date.now() - started) / 1000));
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    poll();
    return () => {
      stopped = true;
    };
  }, [jobId, router]);

  if (job.status === "failed") {
    return (
      <div role="alert" className="space-y-4">
        <p className="text-ink">{job.error ?? "Something went wrong."}</p>
        <Link href="/samples" className={btnPrimary}>Back to samples</Link>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-line">
        <div className="h-full animate-pulse rounded-full bg-ember" style={{ width: `${Math.min(95, 10 + seconds * 1.4)}%` }} />
      </div>
      <p className="text-muted">
        {job.status === "done" ? "Done. Opening your profile..." : seconds < 25 ? "Reading your writing..." : seconds < 50 ? "Merging what we found..." : "Almost there..."}
      </p>
    </div>
  );
}
