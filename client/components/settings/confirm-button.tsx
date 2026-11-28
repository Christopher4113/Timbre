"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { btnQuiet, btnSecondary } from "@/lib/ui";

/** Two-step destructive button: the first click asks, the second submits the server action. */
export function ConfirmButton({ action, label, confirm }: { action: () => Promise<void>; label: string; confirm: string }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={btnSecondary}>
        {label}
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <Submit text={confirm} />
      <button type="button" onClick={() => setAsking(false)} className={btnQuiet}>Cancel</button>
    </form>
  );
}

function Submit({ text }: { text: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} autoFocus className="inline-flex min-h-11 cursor-pointer items-center rounded-[10px] bg-ember px-4 font-medium text-ember-ink hover:opacity-90 disabled:opacity-50">
      {pending ? "Deleting..." : text}
    </button>
  );
}
