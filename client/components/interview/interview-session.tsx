"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { SCENARIOS, type Segment } from "@/lib/interview";
import { btnPrimary, btnSecondary, card } from "@/lib/ui";

export function InterviewSession() {
  return (
    <ConversationProvider>
      <Session />
    </ConversationProvider>
  );
}

type Phase = "idle" | "starting" | "live" | "ended" | "error";


function Session() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [covered, setCovered] = useState<string[]>([]);
  const segments = useRef<Segment[]>([]);
  const connectedAt = useRef(0);
  const interviewId = useRef<string | null>(null);
  const conversation = useConversation();

  async function saveSegments() {
    if (!interviewId.current) return;
    await fetch(`/api/interviews/${interviewId.current}/segments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segments: segments.current }),
      keepalive: true,
    }).catch(() => {});
  }

  async function start() {
    setError(null);
    setPhase("starting");
    try {
      // Ask for the mic up front so the browser prompt appears before the agent talks.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setPhase("error");
      return setError("Timbre needs microphone access for the interview. Allow it in your browser and try again.");
    }

    const res = await fetch("/api/elevenlabs/session", { cache: "no-store" });
    if (!res.ok) {
      setPhase("error");
      return setError(res.status === 429 ? "You've started several interviews today. Try again tomorrow." : "The voice service isn't available right now. Try again in a minute.");
    }
    const { signedUrl } = (await res.json()) as { signedUrl: string };

    conversation.startSession({
      signedUrl,
      clientTools: {
        mark_scenario: ({ name }: { name?: unknown }) => {
          if (typeof name !== "string") return "ignored";
          segments.current.push({ name, atSec: Math.round((Date.now() - connectedAt.current) / 1000) });
          setCovered((c) => (c.includes(name) ? c : [...c, name]));
          return "ok";
        },
      },
      onConnect: async ({ conversationId }) => {
        connectedAt.current = Date.now();
        setPhase("live");
        const r = await fetch("/api/interviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });
        if (r.ok) interviewId.current = ((await r.json()) as { id: string }).id;
      },
      onDisconnect: () => {
        setPhase("ended");
        saveSegments();
      },
      onError: (message) => {
        console.error("voice session error", message);
        setError("The call dropped. Your answers so far are kept.");
      },
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className={`${card} flex min-h-72 flex-col items-center justify-center gap-6 p-8 text-center`}>
        {phase === "idle" || phase === "error" ? (
          <>
            <p className="max-w-md text-muted">
              Find a quiet spot and use headphones if you can. The interviewer will guide you through a few situations. Just talk the way you normally would.
            </p>
            <button type="button" onClick={start} className={btnPrimary}>Start interview</button>
          </>
        ) : phase === "starting" ? (
          <p role="status" className="text-muted">Connecting...</p>
        ) : phase === "live" ? (
          <>
            <MicStatus speaking={conversation.isSpeaking} />
            <button type="button" onClick={() => conversation.endSession()} className={btnSecondary}>End interview</button>
          </>
        ) : (
          <>
            <p className="text-lg text-ink">Thanks, that&rsquo;s the interview done.</p>
            <p className="max-w-md text-muted">Your transcript is being processed now. Next, add a few things you&rsquo;ve written.</p>
            <Link href="/samples" className={btnPrimary}>Continue to writing samples</Link>
          </>
        )}
        {error && <p role="alert" className="text-sm text-ember">{error}</p>}
      </div>
      <ScenarioChecklist covered={covered} />
    </div>
  );
}

function MicStatus({ speaking }: { speaking: boolean }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
      <span className={`size-16 rounded-full border-2 ${speaking ? "border-ember bg-ember/15" : "border-moss bg-moss/10"} transition-colors`} aria-hidden />
      <p className="text-ink">{speaking ? "Interviewer is speaking" : "Listening to you"}</p>
    </div>
  );
}

function ScenarioChecklist({ covered }: { covered: string[] }) {
  return (
    <aside aria-labelledby="scenarios-h" className={`${card} p-5`}>
      <h2 id="scenarios-h" className="font-medium text-ink">Situations</h2>
      <ul className="mt-3 space-y-2.5">
        {SCENARIOS.map((s) => {
          const done = covered.includes(s.name);
          return (
            <li key={s.name} className="flex items-center gap-3 text-[15px]">
              <span aria-hidden className={`size-2.5 rounded-full ${done ? "bg-moss" : "border border-line"}`} />
              <span className={done ? "text-ink" : "text-muted"}>{s.label}</span>
              <span className="sr-only">{done ? "covered" : "not yet"}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
