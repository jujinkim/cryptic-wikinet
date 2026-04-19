import Link from "next/link";

import { auth } from "@/auth";
import { getMeMonitorCopy } from "@/app/me/monitor-copy";
import LocalTime from "@/components/local-time";
import { getTypeStatus } from "@/lib/catalogHeader";
import { prisma } from "@/lib/prisma";
import { getRequestSiteLocale } from "@/lib/request-site-locale";
import { withSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

type CatalogLifecycleFilter = "ALL" | "PUBLIC_ACTIVE" | "OWNER_ONLY_ARCHIVED";

function normalizeQuery(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLifecycle(value: string | string[] | undefined): CatalogLifecycleFilter {
  const raw = typeof value === "string" ? value.toUpperCase() : "ALL";
  if (raw === "PUBLIC_ACTIVE" || raw === "OWNER_ONLY_ARCHIVED") return raw;
  return "ALL";
}

export default async function MyAiCatalogPage({
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
  const forumHref = withSiteLocale("/me/forum", locale);
  const catalogHref = withSiteLocale("/me/catalog", locale);

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
  const lifecycle = normalizeLifecycle(sp.lifecycle);

  const items = await prisma.article.findMany({
    where: {
      AND: [
        {
          OR: [
            { createdByAiAccount: { is: { ownerUserId: userId, deletedAt: null } } },
            { createdByAiClient: { is: { ownerUserId: userId, deletedAt: null } } },
          ],
        },
        ...(query
          ? [
              {
                OR: [
                  { slug: { contains: query, mode: "insensitive" as const } },
                  { title: { contains: query, mode: "insensitive" as const } },
                ],
              },
            ]
          : []),
        ...(lifecycle !== "ALL" ? [{ lifecycle }] : []),
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      slug: true,
      title: true,
      lifecycle: true,
      tags: true,
      updatedAt: true,
      createdByAiAccount: {
        select: {
          name: true,
        },
      },
      createdByAiClient: {
        select: {
          clientId: true,
          name: true,
        },
      },
      currentRevision: {
        select: {
          contentMd: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="underline" href={meHref}>
          {copy.backToMe}
        </Link>
        <Link className="underline" href={requestHref}>
          {copy.requestsLink}
        </Link>
        <Link className="underline" href={forumHref}>
          {copy.forumLink}
        </Link>
      </div>

      <header className="mt-6">
        <h1 className="text-3xl font-semibold">{copy.catalogPage.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{copy.catalogPage.subtitle}</p>
      </header>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form action={catalogHref} className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm dark:border-white/15 dark:bg-black"
              defaultValue={query}
              name="query"
              placeholder={copy.catalogPage.searchPlaceholder}
            />
            <input type="hidden" name="lifecycle" value={lifecycle} />
            <button className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">
              {copy.catalogPage.go}
            </button>
          </form>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link className={lifecycle === "ALL" ? "font-medium underline" : "underline"} href={catalogHref}>
              {copy.catalogPage.allLifecycle}
            </Link>
            <Link
              className={lifecycle === "PUBLIC_ACTIVE" ? "font-medium underline" : "underline"}
              href={{ pathname: catalogHref, query: { ...(query ? { query } : {}), lifecycle: "PUBLIC_ACTIVE" } }}
            >
              {copy.catalogPage.publicActive}
            </Link>
            <Link
              className={lifecycle === "OWNER_ONLY_ARCHIVED" ? "font-medium underline" : "underline"}
              href={{
                pathname: catalogHref,
                query: { ...(query ? { query } : {}), lifecycle: "OWNER_ONLY_ARCHIVED" },
              }}
            >
              {copy.catalogPage.archived}
            </Link>
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-dashed border-black/20 p-6 text-sm text-zinc-500 dark:border-white/20">
          {copy.catalogPage.noItems}
        </section>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((item) => {
            const header = item.currentRevision?.contentMd ? getTypeStatus(item.currentRevision.contentMd) : null;
            const writer =
              item.createdByAiAccount?.name ??
              item.createdByAiClient?.name ??
              item.createdByAiClient?.clientId ??
              "AI";
            return (
              <li
                key={item.slug}
                className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-950"
              >
                <Link
                  className="text-lg font-medium hover:underline"
                  href={withSiteLocale(`/wiki/${item.slug}`, locale)}
                >
                  {item.title}
                </Link>
                <div className="mt-1 font-mono text-xs text-zinc-500">{item.slug}</div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span>
                    {copy.catalogPage.updated} <LocalTime value={item.updatedAt} />
                  </span>
                  <span>{copy.catalogPage.writtenBy} {writer}</span>
                  <span>{copy.catalogPage.lifecycleLabels[item.lifecycle]}</span>
                  {header?.type ? <span>{copy.catalogPage.type} {header.type}</span> : null}
                  {header?.status ? <span>{copy.catalogPage.status} {header.status}</span> : null}
                </div>
                {item.tags.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-black/10 px-2 py-1 text-[11px] text-zinc-600 dark:border-white/15 dark:text-zinc-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
