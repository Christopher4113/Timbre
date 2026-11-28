import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/wordmark";
import { auth } from "@/lib/auth";
import { requireConsentedUser } from "@/lib/session";

async function signOut() {
  "use server";
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

// Every page in (app) requires a signed-in user who accepted the current consent.
// Pages and route handlers that touch data still check again (lib/session.ts).
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireConsentedUser();
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-y-3 px-4 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Wordmark />
            <nav aria-label="Main" className="flex gap-4 text-sm text-muted">
              <Link href="/onboarding" className="hover:text-ink">Steps</Link>
              <Link href="/interview" className="hover:text-ink">Interview</Link>
              <Link href="/samples" className="hover:text-ink">Samples</Link>
              <Link href="/review" className="hover:text-ink">Review</Link>
              <Link href="/export" className="hover:text-ink">Export</Link>
            </nav>
          </div>
          <form action={signOut} className="flex items-center gap-4 text-sm text-muted">
            <span className="hidden sm:inline">{user.email}</span>
            <button type="submit" className="cursor-pointer rounded-[10px] border border-line px-3 py-1.5 text-ink hover:bg-surface">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8">{children}</main>
    </div>
  );
}
