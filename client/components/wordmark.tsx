import Link from "next/link";

export function Wordmark() {
  return (
    <Link href="/" className="font-display text-2xl font-medium tracking-tight text-ink">
      timbre<span className="text-ember">.</span>
    </Link>
  );
}
