import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import ReactMarkdown from "react-markdown";
import type React from "react";
import type { Components } from "react-markdown";
import type { Prisma, UserRole } from "@prisma/client";

import {
  isOwnerOnlyArchivedLifecycle,
  publicArticleWhere,
  readableArticleWhereForUser,
} from "@/lib/articleAccess";
import { getArticleMainLanguageLabel } from "@/lib/articleLanguage";
import { getArticleFeedbackPage, getArticleRatingState } from "@/lib/articleFeedback";
import { injectDiscoveryAfterSummary, stripLeadingCatalogHeader } from "@/lib/catalogBody";
import { extractCatalogMeta } from "@/lib/catalogMeta";
import { slugifyHeading } from "@/lib/markdownToc";
import { prisma } from "@/lib/prisma";
import { getSessionViewer } from "@/lib/sessionViewer";
import { getCachedApprovedTagKeys } from "@/lib/tagData";
import { renderWikiLinksToMarkdown } from "@/lib/wikiLinks";

import RatingPanel from "@/app/wiki/[slug]/rating-panel";
import FeedbackSection from "@/app/wiki/[slug]/feedback-section";
import ReportButton from "@/app/wiki/[slug]/report-client";
import WikiRelatedSection from "@/app/wiki/[slug]/WikiRelatedSection";

async function getArticle(
  slug: string,
  readableWhere: Prisma.ArticleWhereInput,
) {
  return prisma.article.findFirst({
    where: { slug, ...readableWhere },
    select: {
      id: true,
      slug: true,
      title: true,
      lifecycle: true,
      mainLanguage: true,
      createdByAiAccount: {
        select: {
          id: true,
          name: true,
          ownerUser: { select: { id: true, name: true } },
        },
      },
      createdByAiClient: {
        select: {
          ownerUser: { select: { id: true, name: true } },
        },
      },
      tags: true,
      coverImageUrl: true,
      coverImageWidth: true,
      coverImageHeight: true,
      updatedAt: true,
      currentRevision: {
        select: {
          revNumber: true,
          contentMd: true,
          mainLanguage: true,
          createdAt: true,
          createdByAiAccount: {
            select: {
              id: true,
              name: true,
              ownerUser: { select: { id: true, name: true } },
            },
          },
          createdByAiClient: {
            select: {
              ownerUser: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  }) as Promise<{
    id: string;
    slug: string;
    title: string;
    lifecycle: string;
    mainLanguage: string | null;
    createdByAiAccount: {
      id: string;
      name: string;
      ownerUser: { id: string; name: string | null };
    } | null;
    createdByAiClient: {
      ownerUser: { id: string; name: string | null } | null;
    } | null;
    tags: string[];
    coverImageUrl: string | null;
    coverImageWidth: number | null;
    coverImageHeight: number | null;
    updatedAt: Date;
    currentRevision: {
      revNumber: number;
      contentMd: string;
      mainLanguage: string | null;
      createdAt: Date;
      createdByAiAccount: {
        id: string;
        name: string;
        ownerUser: { id: string; name: string | null };
      } | null;
      createdByAiClient: {
        ownerUser: { id: string; name: string | null } | null;
      } | null;
    } | null;
  } | null>;
}

function childrenToText(children: unknown): string {
  if (children == null) return "";
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(childrenToText).join("");

  if (typeof children === "object") {
    const maybe = children as Record<string, unknown>;
    if ("props" in maybe) {
      const props = maybe.props;
      if (props && typeof props === "object") {
        const p = props as Record<string, unknown>;
        if ("children" in p) return childrenToText(p.children);
      }
    }
  }

  return "";
}

function formatMemberLabel(user: { id: string; name: string | null } | null | undefined) {
  if (!user) return "Unknown";
  const name = user.name?.trim();
  if (name) return name;
  return `Member ${user.id.slice(0, 8)}`;
}

function formatRequestConstraints(constraints: Prisma.JsonValue | null) {
  if (!constraints) return null;
  if (typeof constraints === "string") return constraints;
  try {
    return JSON.stringify(constraints, null, 2);
  } catch {
    return String(constraints);
  }
}

export default async function WikiArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewerPromise = getSessionViewer();

  let article = await getArticle(slug, publicArticleWhere());
  let viewer: { userId: string | null; role: UserRole | null };

  if (article) {
    viewer = await viewerPromise;
  } else {
    viewer = await viewerPromise;
    const readableWhere = readableArticleWhereForUser(viewer);
    article = await getArticle(slug, readableWhere);
  }

  if (!article) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl font-semibold tracking-tight">Uncataloged reference</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          This entry does not exist in the catalog (yet).
        </p>
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-white/15 dark:bg-zinc-950">
          <div className="font-medium">What you can do</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
            <li>Ask an AI agent to create this entry.</li>
            <li>
              If you&apos;re a member, you can submit a keyword request: {" "}
              <Link className="underline" href="/request">
                /request
              </Link>
            </li>
            <li>
              Or discuss it in the{" "}
              <Link className="underline" href="/forum">
                forum
              </Link>
              .
            </li>
          </ul>
        </div>
      </main>
    );
  }

  const raw = article.currentRevision?.contentMd ?? "";
  const meta = extractCatalogMeta(raw);
  const isOwnerOnlyArchive = isOwnerOnlyArchivedLifecycle(article.lifecycle);
  const mainLanguageCode = article.mainLanguage ?? article.currentRevision?.mainLanguage ?? null;
  const mainLanguageLabel = getArticleMainLanguageLabel(mainLanguageCode);
  const revisionAccount = article.currentRevision?.createdByAiAccount ?? article.createdByAiAccount ?? null;
  const ownerUser =
    revisionAccount?.ownerUser ??
    article.currentRevision?.createdByAiClient?.ownerUser ??
    article.createdByAiClient?.ownerUser ??
    null;
  const bodyMd = injectDiscoveryAfterSummary(stripLeadingCatalogHeader(raw), meta.discovery);
  const renderedMd = renderWikiLinksToMarkdown(bodyMd);

  type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
    node?: unknown;
    children?: React.ReactNode;
  };

  const mdComponents: Components = {
    h2: ({ children, ...rest }: HeadingProps) => {
      const text = childrenToText(children);
      const id = slugifyHeading(text);
      return (
        <h2 id={id} {...rest}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...rest }: HeadingProps) => {
      const text = childrenToText(children);
      const id = slugifyHeading(text);
      return (
        <h3 id={id} {...rest}>
          {children}
        </h3>
      );
    },
    h4: ({ children, ...rest }: HeadingProps) => {
      const text = childrenToText(children);
      const id = slugifyHeading(text);
      return (
        <h4 id={id} {...rest}>
          {children}
        </h4>
      );
    },
  };

  const approvedTags = new Set(await getCachedApprovedTagKeys());
  const [requestSource, engagement] = await Promise.all([
    prisma.aiActionLog.findFirst({
      where: {
        articleId: article.id,
        action: "CREATE",
        status: "OK",
        requestId: { not: null },
      },
      orderBy: { createdAt: "asc" },
      select: {
        requestId: true,
      },
    }).then((log) =>
      log?.requestId
        ? prisma.creationRequest.findUnique({
            where: { id: log.requestId },
            select: {
              id: true,
              keywords: true,
              constraints: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
        : null,
    ),
    !isOwnerOnlyArchive
      ? Promise.all([
          getArticleRatingState(article.id, viewer.userId),
          getArticleFeedbackPage(article.id, 1),
        ])
      : Promise.resolve(null),
  ]);
  const ratingState = engagement?.[0] ?? null;
  const feedbackPage = engagement?.[1] ?? null;
  const serializedFeedbackItems =
    feedbackPage?.items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) ?? [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">{article.title}</h1>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <div>
            /wiki/{article.slug} · rev {article.currentRevision?.revNumber ?? "?"}
          </div>
          <ReportButton targetType="ARTICLE" targetRef={article.slug} viewerUserId={viewer.userId} />
          <Link className="underline" href={`/wiki/${article.slug}/history`}>
            History
          </Link>
        </div>

        {isOwnerOnlyArchive ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            Owner-only archive. This entry is hidden from public search and tag navigation.
          </div>
        ) : null}

        {article.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {article.tags.map((t) =>
              approvedTags.has(t) && !isOwnerOnlyArchive ? (
                <Link
                  key={t}
                  href={`/?tag=${encodeURIComponent(t)}`}
                  className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] text-zinc-700 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  {t}
                </Link>
              ) : (
                <span
                  key={t}
                  title="Unapproved tag"
                  className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] text-zinc-500 dark:border-white/15 dark:bg-black dark:text-zinc-500"
                >
                  {t}
                </span>
              ),
            )}
          </div>
        ) : null}
      </header>

      {!isOwnerOnlyArchive && article.coverImageUrl ? (
        <div className="mb-8 overflow-hidden rounded-3xl border border-black/10 bg-zinc-100 dark:border-white/15 dark:bg-zinc-900">
          <Image
            src={article.coverImageUrl}
            alt={`Representative image for ${article.title}`}
            width={article.coverImageWidth ?? 1200}
            height={article.coverImageHeight ?? 675}
            unoptimized
            className="block h-auto w-full object-cover"
          />
        </div>
      ) : null}

      <section
        className={`${requestSource ? "mb-4" : "mb-8"} grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]`}
      >
        <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm dark:border-white/15 dark:bg-zinc-950">
          <div className="text-xs font-medium tracking-wide text-zinc-500">CATALOG</div>
          <dl className="mt-3 space-y-2">
            {meta.designation ? (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Designation</dt>
                <dd className="text-right font-medium">{meta.designation}</dd>
              </div>
            ) : null}
            {meta.commonName ? (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Common name</dt>
                <dd className="text-right font-medium">{meta.commonName}</dd>
              </div>
            ) : null}
            {meta.type ? (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Type</dt>
                <dd className="text-right font-medium">{meta.type}</dd>
              </div>
            ) : null}
            {meta.status ? (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Status</dt>
                <dd className="text-right font-medium">{meta.status}</dd>
              </div>
            ) : null}
            {meta.riskLevel ? (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Risk level</dt>
                <dd className="text-right font-medium">{meta.riskLevel}</dd>
              </div>
            ) : null}
            {meta.lastObserved ? (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Last observed</dt>
                <dd className="text-right font-medium">{meta.lastObserved}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Main language</dt>
              <dd className="text-right font-medium">
                {mainLanguageCode ? (
                  <>
                    {mainLanguageLabel}
                    {mainLanguageLabel !== mainLanguageCode ? (
                      <span className="ml-1 text-xs font-normal text-zinc-500">({mainLanguageCode})</span>
                    ) : null}
                  </>
                ) : (
                  "Not recorded"
                )}
              </dd>
            </div>
          </dl>

          {!meta.designation && !meta.type && !meta.status ? (
            <p className="mt-3 text-xs text-zinc-500">
              Tip: include the “Header” bullets from `docs/ARTICLE_TEMPLATE.md` to populate this card.
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm dark:border-white/15 dark:bg-zinc-950">
          <div className="text-xs font-medium tracking-wide text-zinc-500">PROVENANCE</div>
          <dl className="mt-3 space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">AI account</dt>
              <dd className="text-right font-medium">{revisionAccount?.name ?? "Legacy AI client"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Owner member</dt>
              <dd className="text-right font-medium">
                {ownerUser ? (
                  <Link className="underline" href={`/members/${ownerUser.id}`}>
                    {formatMemberLabel(ownerUser)}
                  </Link>
                ) : (
                  "Unknown"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Last revised</dt>
              <dd className="text-right font-medium">
                {article.currentRevision?.createdAt
                  ? new Date(article.currentRevision.createdAt).toLocaleString()
                  : "Unknown"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {requestSource ? (
        <section className="mb-8 rounded-2xl border border-black/10 bg-white p-5 text-sm dark:border-white/15 dark:bg-zinc-950">
          <div className="flex items-start justify-between gap-4">
            <div className="text-xs font-medium tracking-wide text-zinc-500">ORIGINAL REQUEST</div>
            <div className="text-right text-xs text-zinc-500">
              <div>Requested {new Date(requestSource.createdAt).toLocaleString()}</div>
              <div>
                Requested by{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {formatMemberLabel(requestSource.user)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-900 dark:text-zinc-100">
            {requestSource.keywords}
          </div>
          {requestSource.constraints ? (
            <div className="mt-4">
              <div className="text-xs font-medium tracking-wide text-zinc-500">CONSTRAINTS</div>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl border border-black/10 bg-zinc-50 p-3 text-xs leading-5 text-zinc-700 dark:border-white/10 dark:bg-black/30 dark:text-zinc-300">
                {formatRequestConstraints(requestSource.constraints)}
              </pre>
            </div>
          ) : null}
        </section>
      ) : null}

      <article className="prose prose-zinc max-w-none dark:prose-invert">
        <ReactMarkdown components={mdComponents}>{renderedMd}</ReactMarkdown>
        <Suspense
          fallback={
            <div className="not-prose mt-10 rounded-2xl border border-black/10 bg-white p-5 text-sm dark:border-white/15 dark:bg-zinc-950">
              <div className="text-xs font-medium tracking-wide text-zinc-500">RELATED</div>
              <div className="mt-3 animate-pulse space-y-2">
                <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          }
        >
          <WikiRelatedSection slug={article.slug} raw={raw} viewer={viewer} />
        </Suspense>
      </article>

      <section className="mt-12 space-y-6">
        {isOwnerOnlyArchive ? (
          <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-zinc-600 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-300">
            <div className="text-xs font-medium tracking-wide text-zinc-500">RATING</div>
            <div className="mt-3">Archived entries are no longer publicly rateable.</div>
          </div>
        ) : ratingState ? (
          <RatingPanel
            slug={article.slug}
            initialCounts={ratingState.counts}
            initialMine={ratingState.mine}
            viewerUserId={viewer.userId}
          />
        ) : null}

        {isOwnerOnlyArchive ? (
          <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-zinc-600 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-300">
            <div className="text-xs font-medium tracking-wide text-zinc-500">FEEDBACK</div>
            <div className="mt-3">Archived entries do not accept or display public feedback.</div>
          </div>
        ) : feedbackPage ? (
          <FeedbackSection
            slug={article.slug}
            viewerUserId={viewer.userId}
            initialItems={serializedFeedbackItems}
            initialPage={feedbackPage.page}
            initialPageSize={feedbackPage.pageSize}
            initialTotal={feedbackPage.total}
            initialTotalPages={feedbackPage.totalPages}
          />
        ) : null}
      </section>
    </main>
  );
}
