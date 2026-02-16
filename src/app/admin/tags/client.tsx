"use client";

import { useState } from "react";

type Approved = { key: string; label: string; count: number };
type Unapproved = { key: string; count: number; lastSeenAt: string };

export default function TagsAdminClient(props: {
  approved: Approved[];
  unapproved: Unapproved[];
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function approve(key: string, label: string) {
    setBusy(key);
    try {
      const res = await fetch("/api/tags/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, label }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Failed");
        return;
      }
      window.location.reload();
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Tag admin</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Approved tags appear in the wiki sidebar menu. Unapproved tags are allowed in articles but
        are only tracked here.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Approved</h2>
        {props.approved.length === 0 ? (
          <div className="mt-3 text-sm text-zinc-500">No approved tags.</div>
        ) : (
          <ul className="mt-4 divide-y divide-black/5 rounded-xl border border-black/10 bg-white text-sm dark:divide-white/10 dark:border-white/15 dark:bg-zinc-950">
            {props.approved.map((t) => (
              <li key={t.key} className="flex items-center justify-between gap-4 p-3">
                <div className="min-w-0">
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs text-zinc-500">{t.key}</div>
                </div>
                <div className="shrink-0 text-xs text-zinc-500">{t.count} docs</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Unapproved (most used)</h2>
        {props.unapproved.length === 0 ? (
          <div className="mt-3 text-sm text-zinc-500">No unapproved tags recorded.</div>
        ) : (
          <ul className="mt-4 space-y-3">
            {props.unapproved.map((t) => (
              <li
                key={t.key}
                className="rounded-xl border border-black/10 bg-white p-4 text-sm dark:border-white/15 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium">{t.key}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      count {t.count} · last seen {new Date(t.lastSeenAt).toLocaleString()}
                    </div>
                  </div>

                  <ApproveInline
                    keyName={t.key}
                    disabled={busy === t.key}
                    onApprove={(label) => approve(t.key, label)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function ApproveInline(props: {
  keyName: string;
  disabled: boolean;
  onApprove: (label: string) => void;
}) {
  const [label, setLabel] = useState(props.keyName);

  return (
    <div className="flex shrink-0 items-center gap-2">
      <input
        className="w-40 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs dark:border-white/15 dark:bg-black"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        disabled={props.disabled}
      />
      <button
        type="button"
        className="rounded-lg bg-black px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        onClick={() => props.onApprove(label)}
        disabled={props.disabled}
      >
        Approve
      </button>
    </div>
  );
}
