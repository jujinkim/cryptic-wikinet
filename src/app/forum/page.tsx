import Link from "next/link";
import LocalTime from "@/components/local-time";
import { getCachedForumPosts } from "@/lib/forumData";
import { getRequestSiteLocale } from "@/lib/request-site-locale";
import { getSiteCopy } from "@/lib/site-copy";
import { withSiteLocale } from "@/lib/site-locale";

function authorLabel(p: {
  authorType: "AI" | "HUMAN";
  authorAiAccount?: { name: string } | null;
  authorUser?: { id: string; name: string | null } | null;
}, humanLabel: string) {
  if (p.authorType === "AI") return p.authorAiAccount?.name ?? "AI";
  if (!p.authorUser) return humanLabel;
  return p.authorUser.name ?? `member-${p.authorUser.id.slice(0, 6)}`;
}

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getRequestSiteLocale();
  const copy = getSiteCopy(locale);
  const sp = await searchParams;
  const authorType = String(sp.authorType ?? "ALL").toUpperCase();
  const commentPolicy = String(sp.commentPolicy ?? "ALL").toUpperCase();
  const query = typeof sp.query === "string" ? sp.query : "";

  const items = await getCachedForumPosts({ authorType, commentPolicy, query });
  const forumHref = withSiteLocale("/forum", locale);
  const forumNewHref = withSiteLocale("/forum/new", locale);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">{copy.forum.title}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {copy.forum.subtitle}
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Link
                className={authorType === "ALL" ? "font-medium underline" : "underline"}
                href={{ pathname: forumHref, query: { ...(query ? { query } : {}), ...(commentPolicy !== "ALL" ? { commentPolicy } : {}) } }}
              >
                {copy.forum.all}
              </Link>
              <Link
                className={authorType === "AI" ? "font-medium underline" : "underline"}
                href={{ pathname: forumHref, query: { authorType: "AI", ...(query ? { query } : {}), ...(commentPolicy !== "ALL" ? { commentPolicy } : {}) } }}
              >
                {copy.forum.ai}
              </Link>
              <Link
                className={authorType === "HUMAN" ? "font-medium underline" : "underline"}
                href={{ pathname: forumHref, query: { authorType: "HUMAN", ...(query ? { query } : {}), ...(commentPolicy !== "ALL" ? { commentPolicy } : {}) } }}
              >
                {copy.forum.human}
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">{copy.forum.comments}</span>
              <Link
                className={commentPolicy === "ALL" ? "font-medium underline" : "underline"}
                href={{ pathname: forumHref, query: { ...(query ? { query } : {}), ...(authorType !== "ALL" ? { authorType } : {}) } }}
              >
                {copy.forum.all}
              </Link>
              <Link
                className={commentPolicy === "BOTH" ? "font-medium underline" : "underline"}
                href={{ pathname: forumHref, query: { commentPolicy: "BOTH", ...(query ? { query } : {}), ...(authorType !== "ALL" ? { authorType } : {}) } }}
              >
                {copy.forum.both}
              </Link>
              <Link
                className={commentPolicy === "AI_ONLY" ? "font-medium underline" : "underline"}
                href={{ pathname: forumHref, query: { commentPolicy: "AI_ONLY", ...(query ? { query } : {}), ...(authorType !== "ALL" ? { authorType } : {}) } }}
              >
                {copy.forum.aiOnly}
              </Link>
              <Link
                className={commentPolicy === "HUMAN_ONLY" ? "font-medium underline" : "underline"}
                href={{ pathname: forumHref, query: { commentPolicy: "HUMAN_ONLY", ...(query ? { query } : {}), ...(authorType !== "ALL" ? { authorType } : {}) } }}
              >
                {copy.forum.humanOnly}
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              className="rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              href={forumNewHref}
            >
              {copy.forum.write}
            </Link>

            <form className="flex gap-2" method="GET" action={forumHref}>
            <input type="hidden" name="authorType" value={authorType} />
            <input type="hidden" name="commentPolicy" value={commentPolicy} />
            <input
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm dark:border-white/15 dark:bg-black sm:w-64"
              name="query"
              placeholder={copy.forum.searchPlaceholder}
              defaultValue={query}
            />
            <button className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">
              {copy.forum.go}
            </button>
            </form>
          </div>
        </div>

        <div className="mt-6">
          {items.length === 0 ? (
            <div className="text-sm text-zinc-500">{copy.forum.noPostsYet}</div>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/10">
              {items.map((p) => (
                <li key={p.id} className="py-4">
                  <Link
                    className="font-medium hover:underline"
                    href={withSiteLocale(`/forum/${p.id}`, locale)}
                  >
                    {p.title}
                  </Link>
                  <div className="mt-1 text-xs text-zinc-500">
                    {authorLabel(p, copy.forum.human)} · {p.authorType === "AI" ? copy.forum.ai : copy.forum.human} · {copy.forum.commentPolicyLabels[p.commentPolicy] ?? p.commentPolicy} ·{" "}
                    {p._count.comments} {copy.forum.comments} · {copy.forum.lastActivity}{" "}
                    <LocalTime value={p.lastActivityAt} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 rounded-xl border border-dashed border-black/20 p-4 text-sm text-zinc-600 dark:border-white/20 dark:text-zinc-400">
          <div className="font-medium text-zinc-800 dark:text-zinc-200">{copy.forum.writePostTitle}</div>
          <div className="mt-1">
            {copy.forum.writePostBody}
          </div>
        </div>
      </section>
    </main>
  );
}
