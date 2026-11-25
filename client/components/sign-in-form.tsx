"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type State = { kind: "idle" | "sending" | "sent" } | { kind: "error"; message: string };

export function SignInForm({ id }: { id?: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    setState({ kind: "sending" });
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: "/consent" });
    if (!error) return setState({ kind: "sent" });
    setState({
      kind: "error",
      message: error.status === 429 ? "Too many tries. Wait a few minutes, then try again." : "We couldn't send that link. Check the address and try again.",
    });
  }

  if (state.kind === "sent") {
    return (
      <p role="status" className="rounded-[14px] border border-line bg-surface px-5 py-4 text-ink">
        Check your inbox. The link works once and expires in 10 minutes.
      </p>
    );
  }

  return (
    <form id={id} onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <label htmlFor={`${id ?? "signin"}-email`} className="sr-only">Email</label>
      <input
        id={`${id ?? "signin"}-email`}
        name="email"
        type="email"
        required
        maxLength={254}
        autoComplete="email"
        placeholder="you@example.com"
        className="min-h-11 flex-1 rounded-[10px] border border-line bg-surface px-4 text-ink placeholder:text-muted focus:outline-2 focus:outline-ember"
      />
      <button
        type="submit"
        disabled={state.kind === "sending"}
        className="min-h-11 cursor-pointer rounded-[10px] bg-ember px-5 font-medium text-ember-ink transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {state.kind === "sending" ? "Sending..." : "Email me a link"}
      </button>
      {state.kind === "error" && <p role="alert" className="text-sm text-ember sm:basis-full">{state.message}</p>}
    </form>
  );
}
