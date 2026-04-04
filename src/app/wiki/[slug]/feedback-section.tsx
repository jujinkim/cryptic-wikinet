"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import LocalTime from "@/components/local-time";

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

function getCommentRef(id: string) {
  return id.slice(0, 8).toLowerCase();
}

function renderCommentContent(
  content: string,
  commentRefToId: Map<string, string>,
  onCommentLinkClick: (commentId: string) => void,
) {
  const parts: ReactNode[] = [];
  const mentionRe =
    />>(?:comment:)?([0-9a-f]{8}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\b/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionRe.exec(content)) !== null) {
    const raw = match[0];
    const ref = match[1]?.toLowerCase() ?? "";
    const targetId = commentRefToId.get(ref);
    const start = match.index;

    if (start > lastIndex) {
      parts.push(content.slice(lastIndex, start));
    }

    if (targetId) {
      parts.push(
        <a
          key={`${targetId}:${start}`}
          href={`#comment-${targetId}`}
          className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[12px] text-zinc-700 hover:underline dark:bg-white/10 dark:text-zinc-200"
          onClick={() => onCommentLinkClick(targetId)}
        >
          {raw}
        </a>,
      );
    } else {
      parts.push(
        <span
          key={`missing:${start}`}
          className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[12px] text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
        >
          {raw}
        </span>,
      );
    }

    lastIndex = start + raw.length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
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
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  const loggedIn = !!props.viewerUserId;
  const commentRefToId = new Map<string, string>();

  for (const item of items) {
    commentRefToId.set(getCommentRef(item.id), item.id);
    commentRefToId.set(item.id.toLowerCase(), item.id);
  }

  function triggerCommentHighlight(commentId: string) {
    setHighlightedCommentId(commentId);
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedCommentId((current) => (current === commentId ? null : current));
      highlightTimeoutRef.current = null;
    }, 1000);
  }

  useEffect(() => {
    function syncHighlightFromHash() {
      const hash = window.location.hash;
      if (!hash.startsWith("#comment-")) return;
      const commentId = decodeURIComponent(hash.slice("#comment-".length));
      if (!commentId) return;
      triggerCommentHighlight(commentId);
    }

    syncHighlightFromHash();
    window.addEventListener("hashchange", syncHighlightFromHash);
    return () => {
      window.removeEventListener("hashchange", syncHighlightFromHash);
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

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

  function quoteComment(id: string) {
    if (!loggedIn || busy) return;

    const nextRef = `>>${getCommentRef(id)} `;
    setDraft((current) => {
      const trimmed = current.trimEnd();
      if (!trimmed) return nextRef;
      if (trimmed.endsWith(nextRef.trim())) return `${trimmed} `;
      return `${trimmed}\n${nextRef}`;
    });
    textareaRef.current?.focus();
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-950">
      <div className="text-xs font-medium tracking-wide text-zinc-500">FEEDBACK</div>
      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
        Leave a comment for future revisions.
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Mention another comment with <span className="font-mono">&gt;&gt;a1b2c3d4</span>.
      </p>

      <div className="mt-4">
        <textarea
          ref={textareaRef}
          className={
            "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/15 dark:bg-black" +
            (!loggedIn ? " opacity-60" : "")
          }
          rows={4}
          maxLength={2000}
          placeholder={loggedIn ? "Write feedback about this entry. Example: >>a1b2c3d4" : "Verified members can leave feedback"}
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
                id={`comment-${item.id}`}
                className={
                  "rounded-2xl border border-black/10 bg-zinc-50 p-4 transition-[background-color,border-color,box-shadow] duration-1000 dark:border-white/10 dark:bg-black/30" +
                  (highlightedCommentId === item.id
                    ? " border-amber-400 bg-amber-50 shadow-[0_0_0_2px_rgba(251,191,36,0.18)] dark:border-amber-300/50 dark:bg-amber-400/10"
                    : "")
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                      {formatMemberLabel(item.user)}
                    </span>
                    <span><LocalTime value={item.createdAt} /></span>
                    <a
                      href={`#comment-${item.id}`}
                      className="font-mono text-[11px] text-zinc-500 hover:underline"
                      title={item.id}
                    >
                      #{getCommentRef(item.id)}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => quoteComment(item.id)}
                    disabled={!loggedIn || busy}
                    className={
                      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-base leading-none text-zinc-600 transition hover:border-black/20 hover:text-zinc-900 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white" +
                      (!loggedIn || busy ? " cursor-default opacity-40" : "")
                    }
                    title={loggedIn ? `Mention #${getCommentRef(item.id)}` : "Login required"}
                    aria-label={`Reply to comment ${getCommentRef(item.id)}`}
                  >
                    ↩
                  </button>
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-800 dark:text-zinc-200">
                  {renderCommentContent(
                    item.content,
                    commentRefToId,
                    triggerCommentHighlight,
                  )}
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
