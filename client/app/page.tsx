import Link from "next/link";
import { SignInForm } from "@/components/sign-in-form";
import { Wordmark } from "@/components/wordmark";

const steps = [
  { n: "01", title: "Talk for ten minutes", body: "A voice agent walks you through a few everyday situations: introducing yourself, explaining something, disagreeing, telling a story. It listens for how you reason, not how you sound." },
  { n: "02", title: "Paste what you wrote", body: "Three to ten real pieces: an email, a cover letter, a Slack message. Tag each one so Timbre knows the context." },
  { n: "03", title: "Read every rule", body: "Each rule shows the quotes it came from and how sure we are. Keep it, rewrite it or delete it. Nothing is hidden." },
  { n: "04", title: "Take it with you", body: "Download a SKILL.md for Claude, or copy a block into ChatGPT custom instructions. Your voice, wherever you write." },
];

const privacy = [
  ["Audio", "Never stored. The interview is transcribed and the recording is discarded."],
  ["Model providers", "Your transcript and samples are sent to an AI model provider to build the profile and generate drafts. Nothing else."],
  ["Deletion", "Delete transcripts, samples, profiles or your whole account from settings, any time."],
  ["Your name", "Timbre never sends anything on your behalf. It only writes drafts for you to read."],
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const { signin } = await searchParams;

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-8">
        <Wordmark />
        <Link href="#start" className="rounded-[10px] border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface">
          Sign in
        </Link>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl gap-14 px-4 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div className="flex flex-col justify-center">
            {signin && (
              <p role="status" className="mb-6 w-fit rounded-[10px] border border-line bg-surface px-4 py-2 text-sm text-muted">
                Sign in to continue.
              </p>
            )}
            <h1 className="font-display text-[40px] font-normal leading-[1.05] tracking-[-0.02em] text-ink sm:text-[64px]">
              Teach AI how you write. <span className="text-ember">Once.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted sm:text-[19px]">
              A ten-minute voice interview and a few things you have written. Timbre turns them into a voice profile you can read, edit and take into ChatGPT, Claude and the other tools you already use.
            </p>
            <div id="start" className="mt-10 scroll-mt-24">
              <SignInForm id="hero" />
              <p className="mt-3 text-[13px] text-muted">No password. Free while we test. About 20 minutes start to finish.</p>
            </div>
          </div>

          {/* Product preview: the actual artifact, not decoration */}
          <div aria-label="Example of a Timbre rule and two drafts" className="flex flex-col gap-4">
            <article className="rounded-[14px] border border-line bg-surface p-6">
              <div className="flex items-center justify-between text-[13px] text-muted">
                <span>Outreach · from speech + writing</span>
                <span className="whitespace-nowrap rounded-full border border-moss/40 px-2.5 py-0.5 text-moss">high confidence</span>
              </div>
              <p className="mt-3 font-display text-2xl leading-snug text-ink">Lead with the reason you are reaching out.</p>
              <ul className="mt-4 space-y-2 font-mono text-[13px] text-muted">
                <li className="border-l-2 border-ember/60 pl-3">&ldquo;I&rsquo;m reaching out because your post on onboarding hit home&rdquo;</li>
                <li className="border-l-2 border-ember/60 pl-3">&ldquo;so the reason I&rsquo;m calling is, basically&hellip;&rdquo;</li>
              </ul>
            </article>

            <div className="grid gap-4 sm:grid-cols-2">
              <figure className="rounded-[14px] border border-line p-5">
                <figcaption className="text-[13px] text-muted">Draft A</figcaption>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                  I hope this email finds you well. I wanted to take a moment to introduce myself and explore potential synergies&hellip;
                </p>
              </figure>
              <figure className="rounded-[14px] border-2 border-ember bg-surface p-5">
                <figcaption className="flex justify-between text-[13px] text-muted">
                  <span>Draft B</span>
                  <span className="text-ember">picked</span>
                </figcaption>
                <p className="mt-2 text-[15px] leading-relaxed text-ink">
                  Hi Priya, I&rsquo;m reaching out because your onboarding post described exactly the problem I spent last year on.
                </p>
              </figure>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8">
            <h2 className="font-display text-[28px] font-normal tracking-[-0.01em] text-ink sm:text-[36px]">How it works</h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <li key={s.n}>
                  <span className="font-mono text-[13px] text-ember">{s.n}</span>
                  <h3 className="mt-2 text-lg font-medium text-ink">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Blind test */}
        <section className="border-t border-line bg-surface">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 sm:px-8 lg:grid-cols-2">
            <h2 className="font-display text-[28px] font-normal leading-tight tracking-[-0.01em] text-ink sm:text-[36px]">
              You judge it blind.
            </h2>
            <div className="space-y-4 text-[17px] leading-relaxed text-muted">
              <p>
                Give the playground a real task. You get two drafts side by side, in random order, with no labels. One uses your profile and one does not. Same model, same settings.
              </p>
              <p>
                Pick the one that sounds like you, say whether you would send it as is, and fix what is off. If your profile is not winning, you will know, and so will we.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8">
            <h2 className="font-display text-[28px] font-normal tracking-[-0.01em] text-ink sm:text-[36px]">What happens to your data</h2>
            <dl className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
              {privacy.map(([term, desc]) => (
                <div key={term} className="border-t border-line pt-4">
                  <dt className="font-medium text-ink">{term}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-muted">{desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-line">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-8">
            <h2 className="font-display text-[28px] font-normal tracking-[-0.01em] text-ink sm:text-[36px]">Twenty minutes to a profile you can take anywhere.</h2>
            <SignInForm id="footer" />
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-[13px] text-muted sm:flex-row sm:justify-between sm:px-8">
          <Wordmark />
          <p>Timbre learns writing style, never your voice itself. No voice cloning.</p>
        </div>
      </footer>
    </div>
  );
}
