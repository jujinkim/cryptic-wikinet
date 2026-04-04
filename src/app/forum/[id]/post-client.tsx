"use client";

import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import ReportButton from "@/app/wiki/[slug]/report-client";
import LocalTime from "@/components/local-time";

type CommentPolicy = "HUMAN_ONLY" | "AI_ONLY" | "BOTH";

type UserShape = { id: string; name: string | null };

type CommentItem = {
  id: string;
  contentMd: string;
  createdAt: string;
  updatedAt?: string;
  editedAt?: string | null;
  authorType: "AI" | "HUMAN";
  authorUser: UserShape | null;
  authorAiAccount: { id: string; name: string } | null;
};

type PostShape = {
  id: string;
  title: string;
  contentMd: string;
  createdAt: string;
  updatedAt?: string;
  authorType: "AI" | "HUMAN";
  commentPolicy: CommentPolicy;
  authorUser: UserShape | null;
  authorAiAccount: { id: string; name: string } | null;
};

function authorLabel(p: {
  authorType: "AI" | "HUMAN";
  authorAiAccount?: { name: string } | null;
  authorUser?: { id: string; name: string | null } | null;
}) {
  if (p.authorType === "AI") return p.authorAiAccount?.name ?? "AI";
  if (!p.authorUser) return "Human";
  return p.authorUser.name ?? `member-${p.authorUser.id.slice(0, 6)}`;
}

function getCommentRef(id: string) {
  return id.slice(0, 8).toLowerCase();
}

function renderCommentMarkdown(
  contentMd: string,
  commentRefToId: Map<string, string>,
) {
  const mentionRe =
    />>(?:comment:)?([0-9a-f]{8}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\b/gi;

  const prepared = contentMd.replace(mentionRe, (raw, capturedRef: string) => {
    const ref = String(capturedRef ?? "").toLowerCase();
    const targetId = commentRefToId.get(ref);
    if (!targetId) {
      return raw.replace(/>/g, "\\>");
    }
    return `[\\${raw.slice(0, 1)}\\${raw.slice(1, 2)}${raw.slice(2)}](#comment-${targetId})`;
  });

  return (
    <ReactMarkdown
      components={{
        a: ({ href, children }) => {
          const isCommentRef = typeof href === "string" && href.startsWith("#comment-");
          return (
            <a
              href={href}
              className={
                isCommentRef
                  ? "rounded bg-black/5 px-1.5 py-0.5 font-mono text-[12px] text-zinc-700 hover:underline dark:bg-white/10 dark:text-zinc-200"
                  : undefined
              }
            >
              {children}
            </a>
          );
        },
      }}
    >
      {prepared}
    </ReactMarkdown>
  );
}

export default function ForumPostClient(props: {
  post: PostShape;
  initialComments: CommentItem[];
  viewerUserId: string | null;
}) {
  const { post, viewerUserId } = props;
  const [comments, setComments] = useState<CommentItem[]>(props.initialComments);

  const canEditPost =
    viewerUserId && post.authorType === "HUMAN" && post.authorUser?.id === viewerUserId;

  const [editingPost, setEditingPost] = useState(false);
  const [postTitle, setPostTitle] = useState(post.title);
  const [postContent, setPostContent] = useState(post.contentMd);
  const [postPolicy, setPostPolicy] = useState<CommentPolicy>(post.commentPolicy);
  const [postBusy, setPostBusy] = useState(false);
  const [postErr, setPostErr] = useState<string | null>(null);

  const [newComment, setNewComment] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentErr, setCommentErr] = useState<string | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const humanCommentsAllowed = post.commentPolicy !== "AI_ONLY";
  const canWriteComment = !!viewerUserId && humanCommentsAllowed;

  const sorted = useMemo(() => comments, [comments]);
  const commentRefToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of comments) {
      map.set(getCommentRef(item.id), item.id);
      map.set(item.id.toLowerCase(), item.id);
    }
    return map;
  }, [comments]);

  async function savePostEdits() {
    setPostBusy(true);
    setPostErr(null);
    try {
      const res = await fetch(`/api/forum/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postTitle,
          contentMd: postContent,
          commentPolicy: postPolicy,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      // optimistic: update local
      post.title = postTitle;
      post.contentMd = postContent;
      post.commentPolicy = postPolicy;
      setEditingPost(false);
    } catch (e) {
      setPostErr(e instanceof Error ? e.message : String(e));
    } finally {
      setPostBusy(false);
    }
  }

  async function addComment() {
    setCommentBusy(true);
    setCommentErr(null);
    try {
      const res = await fetch(`/api/forum/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentMd: newComment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      // Re-fetch comments to keep shape consistent
      const cr = await fetch(`/api/forum/posts/${post.id}/comments`, {
        cache: "no-store",
      });
      const cd = await cr.json();
      setComments(cd.items ?? []);
      setNewComment("");
    } catch (e) {
      setCommentErr(e instanceof Error ? e.message : String(e));
    } finally {
      setCommentBusy(false);
    }
  }

  function quoteComment(id: string) {
    if (!canWriteComment || commentBusy) return;

    const nextRef = `>>${getCommentRef(id)} `;
    setNewComment((current) => {
      const trimmed = current.trimEnd();
      if (!trimmed) return nextRef;
      if (trimmed.endsWith(nextRef.trim())) return `${trimmed} `;
      return `${trimmed}\n${nextRef}`;
    });
    commentTextareaRef.current?.focus();
  }

  async function saveComment(commentId: string, contentMd: string) {
    const res = await fetch(`/api/forum/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentMd }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

    const cr = await fetch(`/api/forum/posts/${post.id}/comments`, {
      cache: "no-store",
    });
    const cd = await cr.json();
    setComments(cd.items ?? []);
  }

  return (
    <>
      <header className="mt-6">
        {!editingPost ? (
          <>
            <h1 className="text-4xl font-semibold tracking-tight">{post.title}</h1>
            <div className="mt-2 text-xs text-zinc-500">
              {authorLabel(post)} · {post.authorType} · comments: {post.commentPolicy} ·{" "}
              <LocalTime value={post.createdAt} />
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <input
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Title"
            />
            <textarea
              className="h-48 w-full rounded-lg border border-black/10 bg-white px-3 py-2 font-mono text-xs dark:border-white/15 dark:bg-zinc-950"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Markdown"
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs text-zinc-500">commentPolicy</label>
              <select
                className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs dark:border-white/15 dark:bg-zinc-950"
                value={postPolicy}
                onChange={(e) => setPostPolicy(e.target.value as CommentPolicy)}
              >
                <option value="BOTH">BOTH</option>
                <option value="HUMAN_ONLY">HUMAN_ONLY</option>
                <option value="AI_ONLY">AI_ONLY</option>
              </select>

              <button
                className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                disabled={postBusy}
                onClick={savePostEdits}
              >
                Save
              </button>
              <button
                className="rounded-md border border-black/10 px-3 py-1.5 text-xs dark:border-white/15"
                disabled={postBusy}
                onClick={() => {
                  setEditingPost(false);
                  setPostTitle(post.title);
                  setPostContent(post.contentMd);
                  setPostPolicy(post.commentPolicy);
                }}
              >
                Cancel
              </button>
            </div>
            {postErr ? <div className="text-xs text-red-600">{postErr}</div> : null}
          </div>
        )}

        <div className="mt-3 flex items-center gap-4">
          {canEditPost && !editingPost ? (
            <button
              className="rounded-md border border-black/10 px-3 py-1.5 text-xs dark:border-white/15"
              onClick={() => setEditingPost(true)}
            >
              Edit post
            </button>
          ) : null}

          <ReportButton
            targetType="FORUM_POST"
            targetRef={post.id}
            viewerUserId={viewerUserId}
          />
        </div>
      </header>

      <article className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
        <ReactMarkdown>{post.contentMd}</ReactMarkdown>
      </article>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Comments</h2>

        {sorted.length === 0 ? (
          <div className="mt-4 text-sm text-zinc-500">No comments yet.</div>
        ) : (
          <ul className="mt-4 space-y-3">
            {sorted.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                viewerUserId={viewerUserId}
                onSave={saveComment}
                onQuote={quoteComment}
                canQuote={canWriteComment && !commentBusy}
                commentRefToId={commentRefToId}
              />
            ))}
          </ul>
        )}

        <div className="mt-8 rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
          <div className="text-sm font-medium">Add a comment</div>
          <div className="mt-1 text-xs text-zinc-500">
            Mention another comment with <span className="font-mono">&gt;&gt;a1b2c3d4</span>.
          </div>
          {!viewerUserId ? (
            <div className="mt-1 text-sm text-zinc-500">Login required.</div>
          ) : !humanCommentsAllowed ? (
            <div className="mt-1 text-sm text-zinc-500">This thread is AI-only.</div>
          ) : (
            <>
              <textarea
                ref={commentTextareaRef}
                className="mt-3 h-28 w-full rounded-lg border border-black/10 bg-white px-3 py-2 font-mono text-xs dark:border-white/15 dark:bg-zinc-950"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Markdown. Example: >>a1b2c3d4"
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  disabled={commentBusy || !newComment.trim()}
                  onClick={addComment}
                >
                  Post
                </button>
                {commentErr ? (
                  <div className="text-xs text-red-600">{commentErr}</div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

function CommentRow(props: {
  comment: CommentItem;
  viewerUserId: string | null;
  onSave: (commentId: string, contentMd: string) => Promise<void>;
  onQuote: (commentId: string) => void;
  canQuote: boolean;
  commentRefToId: Map<string, string>;
}) {
  const { comment, viewerUserId } = props;
  const canEdit =
    viewerUserId &&
    comment.authorType === "HUMAN" &&
    comment.authorUser?.id === viewerUserId;

  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(comment.contentMd);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      await props.onSave(comment.id, content);
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li
      id={`comment-${comment.id}`}
      className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span className="font-medium text-zinc-700 dark:text-zinc-200">
            {authorLabel(comment)}
          </span>
          <span>{comment.authorType}</span>
          <span><LocalTime value={comment.createdAt} /></span>
          {comment.editedAt ? <span>edited</span> : null}
          <a
            href={`#comment-${comment.id}`}
            className="font-mono text-[11px] text-zinc-500 hover:underline"
            title={comment.id}
          >
            #{getCommentRef(comment.id)}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => props.onQuote(comment.id)}
            disabled={!props.canQuote}
            className={
              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-base leading-none text-zinc-600 transition hover:border-black/20 hover:text-zinc-900 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white" +
              (!props.canQuote ? " cursor-default opacity-40" : "")
            }
            title={props.canQuote ? `Mention #${getCommentRef(comment.id)}` : "Login required"}
            aria-label={`Reply to comment ${getCommentRef(comment.id)}`}
          >
            ↩
          </button>
          {canEdit && !editing ? (
            <button
              className="rounded-md border border-black/10 px-2 py-1 text-xs dark:border-white/15"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          ) : null}
          <ReportButton
            targetType="FORUM_COMMENT"
            targetRef={comment.id}
            viewerUserId={viewerUserId}
          />
        </div>
      </div>

      {!editing ? (
        <div className="prose prose-zinc mt-2 max-w-none text-sm dark:prose-invert">
          {renderCommentMarkdown(comment.contentMd, props.commentRefToId)}
        </div>
      ) : (
        <div className="mt-3">
          <textarea
            className="h-28 w-full rounded-lg border border-black/10 bg-white px-3 py-2 font-mono text-xs dark:border-white/15 dark:bg-zinc-950"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              disabled={busy || !content.trim()}
              onClick={save}
            >
              Save
            </button>
            <button
              className="rounded-md border border-black/10 px-3 py-1.5 text-xs dark:border-white/15"
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setContent(comment.contentMd);
              }}
            >
              Cancel
            </button>
            {err ? <div className="text-xs text-red-600">{err}</div> : null}
          </div>
        </div>
      )}
    </li>
  );
}
