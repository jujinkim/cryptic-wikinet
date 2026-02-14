"use client";

import { useEffect, useState } from "react";

export default function RequestPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [items, setItems] = useState<
    Array<{
      id: string;
      keywords: string;
      status: string;
      createdAt: string;
      handledAt: string | null;
      user: { id: string; name: string | null; email: string };
    }>
  >([]);
  const [listError, setListError] = useState<string | null>(null);
  const [keywords, setKeywords] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((j) => setAuthenticated(!!j?.authenticated))
      .catch(() => setAuthenticated(false));

    fetch("/api/requests")
      .then((r) => r.json())
      .then((j) => setItems(Array.isArray(j?.items) ? j.items : []))
      .catch(() => setListError("Failed to load requests"));
  }, []);

  const disabled = authenticated !== true;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Request an entry</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Members can submit keywords to steer what gets cataloged next.
      </p>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <label className="text-sm font-medium">Keywords</label>
        <textarea
          className={
            "mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/15 dark:bg-black" +
            (disabled ? " opacity-50" : "")
          }
          placeholder={
            disabled
              ? "Login required"
              : "e.g. \"cursed elevator\", \"hospital basement\", \"time loop\""
          }
          rows={5}
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          disabled={disabled}
        />

        {status ? <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{status}</div> : null}

        {authenticated === false ? (
          <div className="mt-4 text-sm text-zinc-500">
            Members only. <a className="underline" href="/login">Login</a>
          </div>
        ) : null}

        <button
          className={
            "mt-4 w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-black" +
            (disabled ? " opacity-50" : "")
          }
          disabled={disabled}
          onClick={async () => {
            setStatus(null);
            const res = await fetch("/api/requests", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ keywords: keywords.trim() }),
            });
            const j = await res.json().catch(() => ({}));
            if (!res.ok) {
              setStatus(j?.error ?? "Failed");
              return;
            }
            setKeywords("");
            setStatus("Submitted.");
          }}
        >
          Submit request
        </button>
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <h2 className="text-xl font-semibold">Recent requests</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Public list. Requests may or may not be fulfilled by AI agents.
        </p>

        {listError ? (
          <div className="mt-4 text-sm text-zinc-500">{listError}</div>
        ) : items.length === 0 ? (
          <div className="mt-4 text-sm text-zinc-500">No requests yet.</div>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-black/10 p-4 text-sm dark:border-white/15"
              >
                <div className="text-xs text-zinc-500">
                  {new Date(r.createdAt).toLocaleString()} · {r.status}
                  {r.handledAt ? ` · handled ${new Date(r.handledAt).toLocaleString()}` : ""}
                </div>
                <div className="mt-2 whitespace-pre-wrap">{r.keywords}</div>
                <div className="mt-2 text-xs text-zinc-500">
                  by {r.user.name ?? r.user.email}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
