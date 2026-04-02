"use client";

import Link from "next/link";
import { useState } from "react";

type FeedbackItem = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
  };
};

function formatMemberLabel(user: FeedbackItem["user"]) {
  const name = user.name?.trim();
  if (name) return name;
  return `Member ${user.id.slice(0, 8)}`;
}

export default function FeedbackSection(props: {
  slug: string;
  viewerUserId: string | null;
  initialItems: FeedbackItem[];
  initialPage: number;
  initialPageSize: number;
  initialTotal: number;
  initialTotalPages: number;
}) {
  const [items, setItems] = useState(props.initialItems);
  const [page, setPage] = useState(props.initialPage);
  const [pageSize] = useState(props.initialPageSize);
  const [total, setTotal] = useState(props.initialTotal);
  const [totalPages, setTotalPages] = useState(props.initialTotalPages);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const loggedIn = !!props.viewerUserId;

  async function loadPage(nextPage: number) {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(
        `/api/articles/${props.slug}/feedback?page=${encodeURIComponent(String(nextPage))}&pageSize=${encodeURIComponent(String(pageSize))}`,
        { cache: "no-store" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data?.error ?? "Failed to load feedback");
        return;
      }
      setItems(Array.isArray(data?.items) ? (data.items as FeedbackItem[]) : []);
      setPage(Number(data?.page ?? nextPage));
      setTotal(Number(data?.total ?? 0));
      setTotalPages(Number(data?.totalPages ?? 1));
    } catch {
      setStatus("Failed to load feedback");
    } finally {
      setBusy(false);
    }
  }

  async function submitFeedback() {
    if (!loggedIn || busy) return;

    const content = draft.trim();
    if (!content) {
      setStatus("Write a comment first");
      return;
    }

    setBusy(true);
    setStatus(null);

    try {
      const res = await fetch(`/api/articles/${props.slug}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data?.error ?? "Failed to save feedback");
        return;
      }

      setDraft("");
      setStatus("Feedback posted");
      await loadPage(1);
    } catch {
      setStatus("Failed to save feedback");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-950">
      <div className="text-xs font-medium tracking-wide text-zinc-500">FEEDBACK</div>
      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
        Leave a comment for future revisions.
      </p>

      <div className="mt-4">
        <textarea
          className={
            "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/15 dark:bg-black" +
            (!loggedIn ? " opacity-60" : "")
          }
          rows={4}
          maxLength={2000}
          placeholder={loggedIn ? "Write feedback about this entry" : "Verified members can leave feedback"}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!loggedIn || busy}
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {!loggedIn ? (
            <div className="text-xs text-zinc-500">
              Verified members only. <Link className="underline" href="/login">Login</Link>
            </div>
          ) : (
            <div className="text-xs text-zinc-500">{draft.trim().length}/2000</div>
          )}

          <button
            type="button"
            onClick={submitFeedback}
            disabled={!loggedIn || busy || !draft.trim()}
            className={
              "rounded-xl bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black" +
              (!loggedIn || busy || !draft.trim() ? " opacity-60" : "")
            }
          >
            Post feedback
          </button>
        </div>

        {status ? <div className="mt-3 text-xs text-zinc-500">{status}</div> : null}
      </div>

      <div className="mt-8 border-t border-black/10 pt-6 dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">
            Comments <span className="text-zinc-500">({total})</span>
          </div>
          <div className="text-xs text-zinc-500">
            Page {page} / {Math.max(totalPages, 1)}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-4 text-sm text-zinc-500">No feedback yet.</div>
        ) : (
          <ul className="mt-4 space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-black/30"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span className="font-medium text-zinc-700 dark:text-zinc-200">
                    {formatMemberLabel(item.user)}
                  </span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-800 dark:text-zinc-200">
                  {item.content}
                </div>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 ? (
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={busy || page <= 1}
              onClick={() => loadPage(page - 1)}
              className={
                "rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-white/15" +
                (busy || page <= 1 ? " opacity-60" : "")
              }
            >
              Previous
            </button>
            <button
              type="button"
              disabled={busy || page >= totalPages}
              onClick={() => loadPage(page + 1)}
              className={
                "rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-white/15" +
                (busy || page >= totalPages ? " opacity-60" : "")
              }
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
