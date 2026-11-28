import Link from "next/link";
import { CopyBlock } from "@/components/export/copy-block";
import { getLatestProfile } from "@/lib/db/queries";
import { CUSTOM_INSTRUCTIONS_LIMIT, renderCustomInstructions } from "@/lib/export/custom-instructions";
import { renderSkillMd } from "@/lib/export/skill-md";
import { VoiceProfile } from "@/lib/schema";
import { displayName, requireConsentedUser } from "@/lib/session";
import { btnPrimary, btnSecondary, card, h1 } from "@/lib/ui";

export default async function ExportPage() {
  const user = await requireConsentedUser();
  const row = await getLatestProfile(user.id);

  if (!row) {
    return (
      <div className="space-y-4">
        <h1 className={h1}>Export</h1>
        <p className="text-muted">Build a profile first.</p>
        <Link href="/samples" className={btnPrimary}>Add writing samples</Link>
      </div>
    );
  }

  const profile = VoiceProfile.parse(row.data);
  const skill = renderSkillMd(profile, displayName(user));

  return (
    <div className="space-y-12">
      <div>
        <h1 className={h1}>Take your voice with you</h1>
        <p className="mt-2 text-muted">
          Exporting version {row.version} with {profile.rules.length} rules. <Link href="/review" className="underline underline-offset-2">Edit rules</Link>
        </p>
      </div>

      <section aria-labelledby="chatgpt-h" className="space-y-3">
        <h2 id="chatgpt-h" className="text-lg font-medium text-ink">ChatGPT custom instructions</h2>
        <p className="text-muted">
          In ChatGPT, open Settings, then Personalization, then Custom instructions. Paste this into the box for how you want ChatGPT to respond. Low-confidence rules are left out so it fits.
        </p>
        <CopyBlock text={renderCustomInstructions(profile)} label="ChatGPT custom instructions" limit={CUSTOM_INSTRUCTIONS_LIMIT} />
      </section>

      <section aria-labelledby="skill-h" className="space-y-3">
        <h2 id="skill-h" className="text-lg font-medium text-ink">Claude skill (SKILL.md)</h2>
        <p className="text-muted">
          Download the file and add it as a skill in Claude, inside a folder named <code className="font-mono text-[13px]">personal-voice</code>.
        </p>
        <div className={`${card} overflow-hidden`}>
          <pre aria-label="SKILL.md preview" className="max-h-96 overflow-auto whitespace-pre-wrap p-5 font-mono text-[13px] leading-relaxed text-ink">{skill}</pre>
          <div className="border-t border-line px-5 py-3">
            <a href="/api/export/skill-md" download="SKILL.md" className={btnSecondary}>Download SKILL.md</a>
          </div>
        </div>
      </section>
    </div>
  );
}
