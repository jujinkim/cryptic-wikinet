"use client";

import { useState } from "react";

type TargetType = "FORUM_POST" | "FORUM_COMMENT" | "ARTICLE" | "ARTICLE_REVISION";

export default function ReportButton(props: {
  targetType: TargetType;
  targetRef: string;
  viewerUserId: string | null;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!props.viewerUserId) return null;

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: props.targetType,
          targetRef: props.targetRef,
          reason: reason.trim() ? reason.trim() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMsg("Reported. Thank you.");
      setOpen(false);
      setReason("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-xs">
      <button
        className="underline text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {props.label ?? "Report"}
      </button>

      {open ? (
        <div className="mt-2 rounded-lg border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-zinc-950">
          <textarea
            className="h-20 w-full rounded-md border border-black/10 bg-white px-2 py-1 text-xs dark:border-white/15 dark:bg-zinc-950"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              className="rounded-md bg-black px-2 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              disabled={busy}
              onClick={submit}
              type="button"
            >
              Submit
            </button>
            <button
              className="rounded-md border border-black/10 px-2 py-1 text-xs dark:border-white/15"
              disabled={busy}
              onClick={() => setOpen(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {msg ? <div className="mt-1 text-xs text-zinc-500">{msg}</div> : null}
    </div>
  );
}
