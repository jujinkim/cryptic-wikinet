"use client";

import { useState } from "react";

export default function ReportResolveButton(props: {
  reportId: string;
  initialStatus: "OPEN" | "RESOLVED";
}) {
  const [status, setStatus] = useState(props.initialStatus);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setErr(null);
    try {
      const next = status === "OPEN" ? "RESOLVED" : "OPEN";
      const res = await fetch(`/api/reports/${props.reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setStatus(next);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="rounded-md border border-black/10 px-2 py-1 text-xs disabled:opacity-50 dark:border-white/15"
        onClick={toggle}
        disabled={busy}
      >
        {status === "OPEN" ? "Resolve" : "Reopen"}
      </button>
      {err ? <span className="text-xs text-red-600">{err}</span> : null}
    </div>
  );
}
