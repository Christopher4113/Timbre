import Link from "next/link";
import { Playground } from "@/components/playground/playground";
import { countComparisons, getLatestProfile } from "@/lib/db/queries";
import { requireConsentedUser } from "@/lib/session";
import { btnPrimary, h1 } from "@/lib/ui";

export default async function PlaygroundPage() {
  const user = await requireConsentedUser();
  const [profile, counts] = await Promise.all([getLatestProfile(user.id), countComparisons(user.id)]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className={h1}>Playground</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Give it something you actually need to write. You&rsquo;ll get two drafts in random order: one uses your profile, one doesn&rsquo;t. Same model, same settings. Pick the one that sounds more like you. Try at least three tasks.
        </p>
        <p className="mt-2 text-sm text-muted">{counts.picked} {counts.picked === 1 ? "task" : "tasks"} done</p>
      </div>
      {profile ? (
        <Playground />
      ) : (
        <div className="space-y-4">
          <p className="text-muted">Build a profile first.</p>
          <Link href="/samples" className={btnPrimary}>Add writing samples</Link>
        </div>
      )}
    </div>
  );
}
