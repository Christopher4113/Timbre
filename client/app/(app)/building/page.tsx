import { redirect } from "next/navigation";
import { z } from "zod";
import { JobStatus } from "@/components/building/job-status";
import { h1 } from "@/lib/ui";

export default async function BuildingPage({ searchParams }: PageProps<"/building">) {
  const job = z.uuid().safeParse((await searchParams).job);
  if (!job.success) redirect("/samples");
  return (
    <div className="space-y-6">
      <h1 className={h1}>Building your profile</h1>
      <p className="max-w-xl text-muted">We read each sample, find the patterns you repeat, and keep only rules we can back with your own words. This usually takes about a minute. You can leave this page and come back.</p>
      <JobStatus jobId={job.data} />
    </div>
  );
}
