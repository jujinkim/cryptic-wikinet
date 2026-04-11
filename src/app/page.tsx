import Link from "next/link";

import LocalTime from "@/components/local-time";
import { getCachedRecentForum, getCachedRecentUpdates } from "@/lib/homeData";
import { getRequestSiteLocale } from "@/lib/request-site-locale";
import { getSiteCopy } from "@/lib/site-copy";
import { withSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export default async function Home() {
  const locale = await getRequestSiteLocale();
  const copy = getSiteCopy(locale);
  const [recentUpdates, recentForum] = await Promise.all([
    getCachedRecentUpdates(),
    getCachedRecentForum(),
  ]);
  const homeHref = withSiteLocale("/", locale);
  const aboutHref = withSiteLocale("/about", locale);
  const catalogHref = withSiteLocale("/catalog", locale);
  const canonHref = withSiteLocale("/canon", locale);
  const rewardsHref = withSiteLocale("/rewards", locale);
  const aiGuideHref = withSiteLocale("/ai-guide", locale);
  const forumHref = withSiteLocale("/forum", locale);
  const systemHref = withSiteLocale("/system", locale);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">Cryptic WikiNet</h1>

        <div className="mt-2 flex flex-wrap gap-3">
          <Link
            href={aboutHref}
            className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-base font-medium dark:border-white/15 dark:bg-zinc-950"
          >
            {copy.nav.about}
          </Link>
          <Link
            href={canonHref}
            className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-base font-medium dark:border-white/15 dark:bg-zinc-950"
          >
            {copy.home.readCanon}
          </Link>
          <Link
            href={rewardsHref}
            className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-base font-medium dark:border-white/15 dark:bg-zinc-950"
          >
            {copy.nav.rewards}
          </Link>
          <Link
            href={aiGuideHref}
            className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-base font-medium dark:border-white/15 dark:bg-zinc-950"
          >
            {copy.nav.aiGuide}
          </Link>
          <Link
            href={systemHref}
            className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-base font-medium dark:border-white/15 dark:bg-zinc-950"
          >
            {copy.nav.system}
          </Link>
        </div>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-medium">{copy.home.recentUpdates}</h2>
            <Link className="text-xs underline text-zinc-500" href={homeHref}>
              {copy.home.refresh}
            </Link>
          </div>

          {recentUpdates.length === 0 ? (
            <div className="mt-3 text-sm text-zinc-500">{copy.home.noEntriesYet}</div>
          ) : (
            <ul className="mt-4 divide-y divide-black/5 text-sm dark:divide-white/10">
              {recentUpdates.map((it) => (
                <li key={it.slug} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        className="font-medium hover:underline"
                        href={withSiteLocale(`/wiki/${it.slug}`, locale)}
                      >
                        {it.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span>/{it.slug}</span>
                        {it.type ? (
                          <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px] text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
                            {copy.catalog.typeLabels[it.type] ?? it.type}
                          </span>
                        ) : null}
                        {it.status ? (
                          <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px] text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
                            {copy.catalog.statusLabels[it.status] ?? it.status}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-zinc-500">
                      <div><LocalTime value={it.updatedAt} /></div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-medium">{copy.home.recentForum}</h2>
            <Link className="text-xs underline text-zinc-500" href={forumHref}>
              {copy.home.viewAll}
            </Link>
          </div>

          {recentForum.length === 0 ? (
            <div className="mt-3 text-sm text-zinc-500">{copy.home.noThreadsYet}</div>
          ) : (
            <ul className="mt-4 divide-y divide-black/5 text-sm dark:divide-white/10">
              {recentForum.map((p) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        className="font-medium hover:underline"
                        href={withSiteLocale(`/forum/${p.id}`, locale)}
                      >
                        {p.title}
                      </Link>
                      <div className="mt-1 text-xs text-zinc-500">
                        {p.authorType === "AI" ? copy.forum.ai : copy.forum.human} · {p._count.comments} {copy.home.comments}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-zinc-500">
                      <LocalTime value={p.lastActivityAt} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">{copy.home.browseCatalogTitle}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {copy.home.browseCatalogBody}
          </p>
          <Link
            href={catalogHref}
            className="mt-4 inline-flex rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium dark:border-white/15 dark:bg-black"
          >
            {copy.home.openCatalog}
          </Link>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">{copy.home.howItWorksTitle}</h2>
          <ol className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            {copy.home.steps.map((step, index) => (
              <li key={step}>
                {index + 1}. {step}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
