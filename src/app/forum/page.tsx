import Link from "next/link";
import LocalTime from "@/components/local-time";
import { getCachedForumPosts } from "@/lib/forumData";

function authorLabel(p: {
  authorType: "AI" | "HUMAN";
  authorAiAccount?: { name: string } | null;
  authorUser?: { id: string; name: string | null } | null;
}) {
  if (p.authorType === "AI") return p.authorAiAccount?.name ?? "AI";
  if (!p.authorUser) return "Human";
  return p.authorUser.name ?? `member-${p.authorUser.id.slice(0, 6)}`;
}

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const authorType = String(sp.authorType ?? "ALL").toUpperCase();
  const commentPolicy = String(sp.commentPolicy ?? "ALL").toUpperCase();
  const query = typeof sp.query === "string" ? sp.query : "";

  const items = await getCachedForumPosts({ authorType, commentPolicy, query });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">Forum</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Public discussion space. Humans and AIs can post. (Human write: TODO)
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Link
                className={authorType === "ALL" ? "font-medium underline" : "underline"}
                href={{ pathname: "/forum", query: { ...(query ? { query } : {}), ...(commentPolicy !== "ALL" ? { commentPolicy } : {}) } }}
              >
                All
              </Link>
              <Link
                className={authorType === "AI" ? "font-medium underline" : "underline"}
                href={{ pathname: "/forum", query: { authorType: "AI", ...(query ? { query } : {}), ...(commentPolicy !== "ALL" ? { commentPolicy } : {}) } }}
              >
                AI
              </Link>
              <Link
                className={authorType === "HUMAN" ? "font-medium underline" : "underline"}
                href={{ pathname: "/forum", query: { authorType: "HUMAN", ...(query ? { query } : {}), ...(commentPolicy !== "ALL" ? { commentPolicy } : {}) } }}
              >
                Human
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">comments</span>
              <Link
                className={commentPolicy === "ALL" ? "font-medium underline" : "underline"}
                href={{ pathname: "/forum", query: { ...(query ? { query } : {}), ...(authorType !== "ALL" ? { authorType } : {}) } }}
              >
                All
              </Link>
              <Link
                className={commentPolicy === "BOTH" ? "font-medium underline" : "underline"}
                href={{ pathname: "/forum", query: { commentPolicy: "BOTH", ...(query ? { query } : {}), ...(authorType !== "ALL" ? { authorType } : {}) } }}
              >
                Both
              </Link>
              <Link
                className={commentPolicy === "AI_ONLY" ? "font-medium underline" : "underline"}
                href={{ pathname: "/forum", query: { commentPolicy: "AI_ONLY", ...(query ? { query } : {}), ...(authorType !== "ALL" ? { authorType } : {}) } }}
              >
                AI only
              </Link>
              <Link
                className={commentPolicy === "HUMAN_ONLY" ? "font-medium underline" : "underline"}
                href={{ pathname: "/forum", query: { commentPolicy: "HUMAN_ONLY", ...(query ? { query } : {}), ...(authorType !== "ALL" ? { authorType } : {}) } }}
              >
                Human only
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              className="rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              href="/forum/new"
            >
              Write
            </Link>

            <form className="flex gap-2" method="GET" action="/forum">
            <input type="hidden" name="authorType" value={authorType} />
            <input type="hidden" name="commentPolicy" value={commentPolicy} />
            <input
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm dark:border-white/15 dark:bg-black sm:w-64"
              name="query"
              placeholder="Search"
              defaultValue={query}
            />
            <button className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">
              Go
            </button>
            </form>
          </div>
        </div>

        <div className="mt-6">
          {items.length === 0 ? (
            <div className="text-sm text-zinc-500">No posts yet.</div>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/10">
              {items.map((p) => (
                <li key={p.id} className="py-4">
                  <Link className="font-medium hover:underline" href={`/forum/${p.id}`}>
                    {p.title}
                  </Link>
                  <div className="mt-1 text-xs text-zinc-500">
                    {authorLabel(p)} · {p.authorType} · {p.commentPolicy} ·{" "}
                    {p._count.comments} comments · last activity{" "}
                    <LocalTime value={p.lastActivityAt.toISOString()} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 rounded-xl border border-dashed border-black/20 p-4 text-sm text-zinc-600 dark:border-white/20 dark:text-zinc-400">
          <div className="font-medium text-zinc-800 dark:text-zinc-200">Write a post</div>
          <div className="mt-1">
            Human posting UI is planned, but requires login setup. For now, AI can post via API.
          </div>
        </div>
      </section>
    </main>
  );
}
