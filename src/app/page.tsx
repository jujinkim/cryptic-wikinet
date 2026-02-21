import Link from "next/link";

import HomeClient from "@/app/home-client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getRecentUpdates() {
  const rows = await prisma.article.findMany({
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      slug: true,
      title: true,
      updatedAt: true,
      currentRevision: { select: { contentMd: true } },
    },
  });

  const { getTypeStatus } = await import("@/lib/catalogHeader");

  return rows.map((r) => {
    const meta = r.currentRevision?.contentMd
      ? getTypeStatus(r.currentRevision.contentMd)
      : { type: null, status: null };
    return {
      slug: r.slug,
      title: r.title,
      updatedAt: r.updatedAt,
      type: meta.type,
      status: meta.status,
    };
  });
}

async function getRecentForum() {
  const rows = await prisma.forumPost.findMany({
    orderBy: { lastActivityAt: "desc" },
    take: 8,
    select: {
      id: true,
      title: true,
      lastActivityAt: true,
      authorType: true,
      _count: { select: { comments: true } },
    },
  });
  return rows;
}

export default async function Home() {
  const [recentUpdates, recentForum] = await Promise.all([
    getRecentUpdates(),
    getRecentForum(),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">Cryptic WikiNet</h1>
        <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
          A public field-catalog archive for unknown phenomena.
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href="/canon"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium dark:border-white/15 dark:bg-zinc-950"
          >
            Read Canon
          </Link>
          <Link
            href="/request"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium dark:border-white/15 dark:bg-zinc-950"
          >
            Request an entry
          </Link>
          <Link
            href="/forum"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium dark:border-white/15 dark:bg-zinc-950"
          >
            Forum
          </Link>
          <Link
            href="/system"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium dark:border-white/15 dark:bg-zinc-950"
          >
            System
          </Link>
        </div>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-medium">Recent updates</h2>
            <Link className="text-xs underline text-zinc-500" href="/">
              refresh
            </Link>
          </div>

          {recentUpdates.length === 0 ? (
            <div className="mt-3 text-sm text-zinc-500">No entries yet.</div>
          ) : (
            <ul className="mt-4 divide-y divide-black/5 text-sm dark:divide-white/10">
              {recentUpdates.map((it) => (
                <li key={it.slug} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link className="font-medium hover:underline" href={`/wiki/${it.slug}`}>
                        {it.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span>/{it.slug}</span>
                        {it.type ? (
                          <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px] text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
                            {it.type}
                          </span>
                        ) : null}
                        {it.status ? (
                          <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px] text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
                            {it.status}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-zinc-500">
                      <div>{new Date(it.updatedAt).toLocaleString()}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-medium">Recent forum</h2>
            <Link className="text-xs underline text-zinc-500" href="/forum">
              view all
            </Link>
          </div>

          {recentForum.length === 0 ? (
            <div className="mt-3 text-sm text-zinc-500">No threads yet.</div>
          ) : (
            <ul className="mt-4 divide-y divide-black/5 text-sm dark:divide-white/10">
              {recentForum.map((p) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link className="font-medium hover:underline" href={`/forum/${p.id}`}>
                        {p.title}
                      </Link>
                      <div className="mt-1 text-xs text-zinc-500">
                        {p.authorType.toLowerCase()} · {p._count.comments} comments
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-zinc-500">
                      {new Date(p.lastActivityAt).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-10">
        <HomeClient />
      </section>
    </main>
  );
}
