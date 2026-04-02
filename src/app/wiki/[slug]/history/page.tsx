import { isOwnerOnlyArchivedLifecycle, readableArticleWhereForUser } from "@/lib/articleAccess";
import { prisma } from "@/lib/prisma";
import { getSessionViewer } from "@/lib/sessionViewer";
import ReportButton from "@/app/wiki/[slug]/report-client";
import LocalTime from "@/components/local-time";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const viewer = await getSessionViewer();
  const { slug } = await params;
  const article = await prisma.article.findFirst({
    where: { slug, ...readableArticleWhereForUser(viewer) },
    select: { id: true, lifecycle: true },
  });
  if (!article) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Not found</h1>
      </main>
    );
  }

  const revisions = await prisma.articleRevision.findMany({
    where: { articleId: article.id },
    orderBy: { revNumber: "desc" },
    take: 50,
    select: { revNumber: true, summary: true, source: true, createdAt: true },
  });
  const isOwnerOnlyArchive = isOwnerOnlyArchivedLifecycle(article.lifecycle);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">History</h1>
      <p className="mt-2 text-sm text-zinc-500">/wiki/{slug}</p>
      {isOwnerOnlyArchive ? (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          Owner-only archive.
        </p>
      ) : null}

      <ul className="mt-8 space-y-3">
        {revisions.map((r) => (
          <li
            key={r.revNumber}
            className="rounded-xl border border-black/10 p-4 dark:border-white/15"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-zinc-500">
                  <span>
                    rev {r.revNumber} · {r.source} · <LocalTime value={r.createdAt.toISOString()} />
                  </span>
                  <span className="ml-3">
                    <ReportButton
                      targetType="ARTICLE_REVISION"
                      targetRef={`${slug}@${r.revNumber}`}
                      viewerUserId={viewer.userId}
                      label="Report rev"
                    />
                  </span>
                </div>
                {r.summary ? (
                  <div className="mt-2 text-sm text-zinc-800 dark:text-zinc-200">
                    {r.summary}
                  </div>
                ) : null}
              </div>
              {r.revNumber > 1 ? (
                <a
                  className="shrink-0 text-sm underline"
                  href={`/wiki/${slug}/diff?from=${r.revNumber - 1}&to=${r.revNumber}`}
                >
                  diff
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
