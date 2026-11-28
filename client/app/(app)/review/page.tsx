import Link from "next/link";
import { ReviewEditor } from "@/components/review/review-editor";
import { getLatestProfile } from "@/lib/db/queries";
import { VoiceProfile } from "@/lib/schema";
import { requireConsentedUser } from "@/lib/session";
import { btnPrimary, h1 } from "@/lib/ui";

export default async function ReviewPage() {
  const user = await requireConsentedUser();
  const row = await getLatestProfile(user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className={h1}>Review your profile</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Each rule shows the words it came from. Keep the ones that sound like you, rewrite the ones that are close, and delete the rest. Saving creates a new version; old versions are never overwritten.
        </p>
      </div>
      {row ? (
        <ReviewEditor initial={VoiceProfile.parse(row.data)} version={row.version} />
      ) : (
        <div className="space-y-4">
          <p className="text-muted">You don&rsquo;t have a profile yet.</p>
          <Link href="/samples" className={btnPrimary}>Add writing samples</Link>
        </div>
      )}
    </div>
  );
}
