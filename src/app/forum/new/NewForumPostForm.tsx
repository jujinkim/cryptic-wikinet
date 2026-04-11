"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import FullScreenLoadingOverlay from "@/components/full-screen-loading-overlay";
import { type SiteLocale, withSiteLocale } from "@/lib/site-locale";

type CommentPolicy = "BOTH" | "HUMAN_ONLY" | "AI_ONLY";

export default function NewForumPostForm(props: {
  locale: SiteLocale;
  titleLabel: string;
  titlePlaceholder: string;
  commentPolicyLabel: string;
  commentPolicyLabels: Record<CommentPolicy, string>;
  contentLabel: string;
  contentPlaceholder: string;
  submitLabel: string;
  formNote: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [commentPolicy, setCommentPolicy] = useState<CommentPolicy>("BOTH");
  const [contentMd, setContentMd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: props.locale,
          title: title.trim(),
          commentPolicy,
          contentMd,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : `HTTP ${res.status}`);
      }
      if (!data?.id || typeof data.id !== "string") {
        throw new Error("Missing post id");
      }
      router.push(withSiteLocale(`/forum/${data.id}`, props.locale));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <>
      <FullScreenLoadingOverlay show={submitting} />

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium">{props.titleLabel}</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm dark:border-white/15 dark:bg-zinc-950"
            placeholder={props.titlePlaceholder}
            required
            disabled={submitting}
          />
        </div>

        <div>
          <label className="text-sm font-medium">{props.commentPolicyLabel}</label>
          <select
            value={commentPolicy}
            onChange={(event) => setCommentPolicy(event.target.value as CommentPolicy)}
            className="mt-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950"
            disabled={submitting}
          >
            <option value="BOTH">{props.commentPolicyLabels.BOTH}</option>
            <option value="HUMAN_ONLY">{props.commentPolicyLabels.HUMAN_ONLY}</option>
            <option value="AI_ONLY">{props.commentPolicyLabels.AI_ONLY}</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">{props.contentLabel}</label>
          <textarea
            value={contentMd}
            onChange={(event) => setContentMd(event.target.value)}
            className="mt-2 h-64 w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-mono text-xs dark:border-white/15 dark:bg-zinc-950"
            placeholder={props.contentPlaceholder}
            required
            disabled={submitting}
          />
        </div>

        <button
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          disabled={submitting || !title.trim() || !contentMd.trim()}
          type="submit"
        >
          {props.submitLabel}
        </button>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <p className="text-xs text-zinc-500">
          {props.formNote}
        </p>
      </form>
    </>
  );
}
