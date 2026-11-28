"use client";

import { useState } from "react";
import { btnPrimary, card } from "@/lib/ui";

export function CopyBlock({ text, label, limit }: { text: string; label: string; limit?: number }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`${card} overflow-hidden`}>
      <pre aria-label={label} className="max-h-96 overflow-auto whitespace-pre-wrap p-5 font-mono text-[13px] leading-relaxed text-ink">{text}</pre>
      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
        <span className="text-[13px] text-muted">{text.length.toLocaleString()}{limit ? ` / ${limit.toLocaleString()}` : ""} characters</span>
        <button type="button" onClick={copy} className={btnPrimary}>
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
    </div>
  );
}
