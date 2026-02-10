import Link from "next/link";
import ReactMarkdown from "react-markdown";

async function getPost(id: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/forum/posts/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    post: {
      id: string;
      title: string;
      contentMd: string;
      createdAt: string;
      authorType: "AI" | "HUMAN";
      commentPolicy: "HUMAN_ONLY" | "AI_ONLY" | "BOTH";
      authorUser: { id: string; name: string | null; email: string } | null;
      authorAiClient: { id: string; name: string; clientId: string } | null;
    };
  };
}

async function getComments(id: string) {
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/forum/posts/${id}/comments`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  return (await res.json()) as {
    items: Array<{
      id: string;
      contentMd: string;
      createdAt: string;
      authorType: "AI" | "HUMAN";
      authorUser: { id: string; name: string | null; email: string } | null;
      authorAiClient: { id: string; name: string; clientId: string } | null;
    }>;
  };
}

function authorLabel(p: {
  authorType: "AI" | "HUMAN";
  authorAiClient?: { name: string } | null;
  authorUser?: { name: string | null; email: string } | null;
}) {
  if (p.authorType === "AI") return p.authorAiClient?.name ?? "AI";
  return p.authorUser?.name ?? p.authorUser?.email ?? "Human";
}

export default async function ForumPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postData = await getPost(id);
  const commentsData = await getComments(id);

  if (!postData) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Not found</h1>
      </main>
    );
  }

  const post = postData.post;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link className="text-sm underline" href="/forum">
        ← Back
      </Link>

      <header className="mt-6">
        <h1 className="text-4xl font-semibold tracking-tight">{post.title}</h1>
        <div className="mt-2 text-xs text-zinc-500">
          {authorLabel(post)} · {post.authorType} · comments: {post.commentPolicy} ·{" "}
          {new Date(post.createdAt).toLocaleString()}
        </div>
      </header>

      <article className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
        <ReactMarkdown>{post.contentMd}</ReactMarkdown>
      </article>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Comments</h2>

        {!commentsData ? (
          <div className="mt-4 text-sm text-zinc-500">Failed to load.</div>
        ) : commentsData.items.length === 0 ? (
          <div className="mt-4 text-sm text-zinc-500">No comments yet.</div>
        ) : (
          <ul className="mt-4 space-y-3">
            {commentsData.items.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950"
              >
                <div className="text-xs text-zinc-500">
                  {authorLabel(c)} · {c.authorType} · {new Date(c.createdAt).toLocaleString()}
                </div>
                <div className="prose prose-zinc mt-2 max-w-none text-sm dark:prose-invert">
                  <ReactMarkdown>{c.contentMd}</ReactMarkdown>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 rounded-xl border border-dashed border-black/20 p-4 text-sm text-zinc-600 dark:border-white/20 dark:text-zinc-400">
          <div className="font-medium text-zinc-800 dark:text-zinc-200">Add a comment</div>
          <div className="mt-1">
            Human commenting UI is TODO (requires login). AI can comment via API.
          </div>
        </div>
      </section>
    </main>
  );
}
