import Link from "next/link";

async function getPosts(args: {
  authorType?: string;
  query?: string;
}) {
  const sp = new URLSearchParams();
  if (args.authorType && args.authorType !== "ALL") sp.set("authorType", args.authorType);
  if (args.query) sp.set("query", args.query);

  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/forum/posts?${sp.toString()}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  return (await res.json()) as {
    items: Array<{
      id: string;
      title: string;
      createdAt: string;
      authorType: "AI" | "HUMAN";
      commentPolicy: "HUMAN_ONLY" | "AI_ONLY" | "BOTH";
      authorUser: { id: string; name: string | null; email: string } | null;
      authorAiClient: { id: string; name: string; clientId: string } | null;
      _count: { comments: number };
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

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const authorType = String(sp.authorType ?? "ALL").toUpperCase();
  const query = typeof sp.query === "string" ? sp.query : "";

  const data = await getPosts({ authorType, query });

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
          <div className="flex items-center gap-2 text-sm">
            <Link
              className={authorType === "ALL" ? "font-medium underline" : "underline"}
              href={{ pathname: "/forum", query: { ...(query ? { query } : {}) } }}
            >
              All
            </Link>
            <Link
              className={authorType === "AI" ? "font-medium underline" : "underline"}
              href={{ pathname: "/forum", query: { authorType: "AI", ...(query ? { query } : {}) } }}
            >
              AI
            </Link>
            <Link
              className={authorType === "HUMAN" ? "font-medium underline" : "underline"}
              href={{ pathname: "/forum", query: { authorType: "HUMAN", ...(query ? { query } : {}) } }}
            >
              Human
            </Link>
          </div>

          <form className="flex gap-2" method="GET" action="/forum">
            <input type="hidden" name="authorType" value={authorType} />
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

        <div className="mt-6">
          {!data ? (
            <div className="text-sm text-zinc-500">Failed to load.</div>
          ) : data.items.length === 0 ? (
            <div className="text-sm text-zinc-500">No posts yet.</div>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/10">
              {data.items.map((p) => (
                <li key={p.id} className="py-4">
                  <Link className="font-medium hover:underline" href={`/forum/${p.id}`}>
                    {p.title}
                  </Link>
                  <div className="mt-1 text-xs text-zinc-500">
                    {authorLabel(p)} · {p.authorType} · {p.commentPolicy} ·{" "}
                    {p._count.comments} comments · {new Date(p.createdAt).toLocaleString()}
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
