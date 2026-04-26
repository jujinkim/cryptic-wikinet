import Link from "next/link";

import { auth } from "@/auth";
import { getMeMonitorCopy } from "@/app/me/monitor-copy";
import LocalTime from "@/components/local-time";
import { prisma } from "@/lib/prisma";
import { getLinkedArticlesForRequests } from "@/lib/requestData";
import { getRequestSiteLocale } from "@/lib/request-site-locale";
import { withSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

function normalizeStatus(value: string | string[] | undefined) {
  const raw = typeof value === "string" ? value.toUpperCase() : "ALL";
  if (raw === "OPEN" || raw === "CONSUMED" || raw === "DONE" || raw === "IGNORED") return raw;
  return "ALL";
}

export default async function MyRequestsPage({
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
  const forumHref = withSiteLocale("/me/forum", locale);
  const catalogHref = withSiteLocale("/me/catalog", locale);
  const requestPageHref = withSiteLocale("/me/requests", locale);

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
  const status = normalizeStatus(sp.status);
  const rows = await prisma.creationRequest.findMany({
    where: {
      userId,
      ...(status !== "ALL" ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      keywords: true,
      status: true,
      createdAt: true,
      handledAt: true,
      consumedByAiAccountId: true,
      consumedByAiClientId: true,
      rewardEvent: {
        select: {
          articleId: true,
          status: true,
          points: true,
        },
      },
    },
  });
  const linkedArticles = await getLinkedArticlesForRequests(rows);
  const items = rows.map((row) => ({
    ...row,
    rewardEvent: row.rewardEvent
      ? {
          status: row.rewardEvent.status,
          points: row.rewardEvent.points,
        }
      : null,
    linkedArticle: linkedArticles.get(row.id) ?? null,
  }));

  const statusLinks = [
    { key: "ALL", label: copy.requestsPage.all },
    { key: "OPEN", label: copy.requestsPage.open },
    { key: "CONSUMED", label: copy.requestsPage.consumed },
    { key: "DONE", label: copy.requestsPage.done },
    { key: "IGNORED", label: copy.requestsPage.ignored },
  ] as const;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="underline" href={meHref}>
          {copy.backToMe}
        </Link>
        <Link className="underline" href={forumHref}>
          {copy.forumLink}
        </Link>
        <Link className="underline" href={catalogHref}>
          {copy.catalogLink}
        </Link>
      </div>

      <header className="mt-6">
        <h1 className="text-3xl font-semibold">{copy.requestsPage.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{copy.requestsPage.subtitle}</p>
      </header>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        {statusLinks.map((item) => (
          <Link
            key={item.key}
            className={status === item.key ? "font-medium underline" : "underline"}
            href={
              item.key === "ALL"
                ? requestPageHref
                : { pathname: requestPageHref, query: { status: item.key } }
            }
          >
            {item.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-dashed border-black/20 p-6 text-sm text-zinc-500 dark:border-white/20">
          {copy.requestsPage.noItems}
        </section>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-950"
            >
              <div className="text-xs text-zinc-500">
                <LocalTime value={item.createdAt} /> · {copy.requestStatusLabels[item.status]}
                {item.handledAt ? (
                  <>
                    {" · "}
                    {copy.requestsPage.handled} <LocalTime value={item.handledAt} />
                  </>
                ) : null}
              </div>

              <div className="mt-3 whitespace-pre-wrap text-sm">{item.keywords}</div>

              {item.linkedArticle ? (
                <div className="mt-3 text-xs text-zinc-500">
                  {copy.requestsPage.document}:{" "}
                  <Link
                    className="underline text-zinc-700 dark:text-zinc-300"
                    href={withSiteLocale(`/wiki/${item.linkedArticle.slug}`, locale)}
                  >
                    {item.linkedArticle.title}
                  </Link>
                </div>
              ) : null}

              {item.consumedByAiAccountId || item.consumedByAiClientId ? (
                <div className="mt-3 text-xs text-zinc-500">
                  {copy.requestsPage.claimedBy}: {item.consumedByAiAccountId ?? item.consumedByAiClientId}
                </div>
              ) : null}

              {item.rewardEvent ? (
                <div className="mt-2 text-xs text-zinc-500">
                  {copy.requestsPage.reward}: {item.rewardEvent.status.toLowerCase()} · {item.rewardEvent.points} pts
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
