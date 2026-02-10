"use client";

import { useEffect, useState } from "react";

type Verdict = "GOOD" | "MEH" | "BAD";

type AuthState =
  | { loading: true }
  | { loading: false; authenticated: boolean };

export default function RatingPanel({ slug }: { slug: string }) {
  const [auth, setAuth] = useState<AuthState>({ loading: true });
  const [verdict, setVerdict] = useState<Verdict>("GOOD");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((j) => {
        setAuth({ loading: false, authenticated: !!j?.authenticated });
      })
      .catch(() => setAuth({ loading: false, authenticated: false }));
  }, []);

  const disabled = auth.loading || !auth.authenticated;

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 text-sm dark:border-white/15 dark:bg-zinc-950">
      <div className="text-xs font-medium tracking-wide text-zinc-500">FEEDBACK</div>
      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
        Rate this entry to guide future revisions.
      </p>

      <div className="mt-4 flex gap-2">
        {(["GOOD", "MEH", "BAD"] as const).map((v) => (
          <button
            key={v}
            disabled={disabled}
            onClick={() => setVerdict(v)}
            className={
              "rounded-xl px-3 py-2 text-xs font-medium transition " +
              (verdict === v
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "border border-black/10 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-200 dark:hover:bg-zinc-900") +
              (disabled ? " opacity-50" : "")
            }
          >
            {v === "GOOD" ? "Good" : v === "MEH" ? "Meh" : "Bad"}
          </button>
        ))}
      </div>

      <textarea
        className={
          "mt-3 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs dark:border-white/15 dark:bg-black" +
          (disabled ? " opacity-50" : "")
        }
        placeholder={disabled ? "Login required to comment" : "Optional comment"}
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={disabled}
      />

      {status ? <div className="mt-2 text-xs text-zinc-500">{status}</div> : null}

      {!auth.loading && !auth.authenticated ? (
        <div className="mt-3 text-xs text-zinc-500">
          Members only. <a className="underline" href="/login">Login</a>
        </div>
      ) : null}

      <button
        className={
          "mt-3 w-full rounded-xl bg-black px-3 py-2 text-xs font-medium text-white dark:bg-white dark:text-black" +
          (disabled ? " opacity-50" : "")
        }
        disabled={disabled}
        onClick={async () => {
          setStatus(null);
          const res = await fetch(`/api/articles/${slug}/rating`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ verdict, comment: comment.trim() || null }),
          });
          const j = await res.json().catch(() => ({}));
          if (!res.ok) {
            setStatus(j?.error ?? "Failed");
            return;
          }
          setStatus("Saved.");
        }}
      >
        Submit feedback
      </button>
    </section>
  );
}
