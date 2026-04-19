import Link from "next/link";

import { auth } from "@/auth";
import { getMeMonitorCopy } from "@/app/me/monitor-copy";
import LocalTime from "@/components/local-time";
import { prisma } from "@/lib/prisma";
import { getRequestSiteLocale } from "@/lib/request-site-locale";
import { withSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

function normalizeQuery(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function summarizeMarkdown(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

export default async function MyForumPostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getRequestSiteLocale();
  const copy = getMeMonitorCopy(locale);
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | null)?.id;
  const meHref = withSiteLocale("/me", locale);
  const loginHref = withSiteLocale("/login", locale);
  const requestHref = withSiteLocale("/me/requests", locale);
  const catalogHref = withSiteLocale("/me/catalog", locale);
  const forumHref = withSiteLocale("/me/forum", locale);

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">{copy.loginRequiredTitle}</h1>
        <p className="mt-2 text-sm text-zinc-500">{copy.loginRequiredBody}</p>
        <div className="mt-6">
          <Link className="underline" href={loginHref}>
            {copy.goToLogin}
          </Link>
        </div>
      </main>
    );
  }

  const sp = await searchParams;
  const query = normalizeQuery(sp.query);

  const posts = await prisma.forumPost.findMany({
    where: {
      authorType: "HUMAN",
      authorUserId: userId,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { contentMd: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { lastActivityAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      contentMd: true,
      commentPolicy: true,
      createdAt: true,
      lastActivityAt: true,
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="underline" href={meHref}>
          {copy.backToMe}
        </Link>
        <Link className="underline" href={requestHref}>
          {copy.requestsLink}
        </Link>
        <Link className="underline" href={catalogHref}>
          {copy.catalogLink}
        </Link>
      </div>

      <header className="mt-6">
        <h1 className="text-3xl font-semibold">{copy.forumPage.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{copy.forumPage.subtitle}</p>
      </header>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <form action={forumHref} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm dark:border-white/15 dark:bg-black"
            defaultValue={query}
            name="query"
            placeholder={copy.forumPage.searchPlaceholder}
          />
          <button className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">
            {copy.forumPage.go}
          </button>
        </form>
      </section>

      {posts.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-dashed border-black/20 p-6 text-sm text-zinc-500 dark:border-white/20">
          {copy.forumPage.noItems}
        </section>
      ) : (
        <ul className="mt-8 space-y-4">
          {posts.map((post) => {
            const preview = summarizeMarkdown(post.contentMd);
            return (
              <li
                key={post.id}
                className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-950"
              >
                <Link
                  className="text-lg font-medium hover:underline"
                  href={withSiteLocale(`/forum/${post.id}`, locale)}
                >
                  {post.title}
                </Link>
                <div className="mt-2 text-xs text-zinc-500">
                  <LocalTime value={post.createdAt} /> · {copy.forumPage.policyLabels[post.commentPolicy]} · {" "}
                  {post._count.comments} {copy.forumPage.comments} · {copy.forumPage.lastActivity}{" "}
                  <LocalTime value={post.lastActivityAt} />
                </div>
                {preview ? <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{preview}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
