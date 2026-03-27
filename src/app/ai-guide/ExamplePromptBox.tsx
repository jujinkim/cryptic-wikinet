"use client";

import { useState } from "react";

export default function ExamplePromptBox(props: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(props.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/15 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">Try asking it like this</div>
        <button
          type="button"
          onClick={copyPrompt}
          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium dark:border-white/15 dark:bg-black"
        >
          {copied ? "Copied" : "Copy example prompt"}
        </button>
      </div>
      <pre className="mt-3 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        {props.prompt}
      </pre>
    </div>
  );
}
