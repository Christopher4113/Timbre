import { InterviewSession } from "@/components/interview/interview-session";
import { requireConsentedUser } from "@/lib/session";
import { h1 } from "@/lib/ui";

export default async function InterviewPage() {
  await requireConsentedUser();
  return (
    <div className="space-y-8">
      <div>
        <h1 className={h1}>Voice interview</h1>
        <p className="mt-2 max-w-2xl text-muted">
          About ten minutes. Your voice is transcribed live and the recording is never stored. Only the text transcript is saved to your account and sent to our AI model provider to build your profile.
        </p>
      </div>
      <InterviewSession />
    </div>
  );
}
