import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type React from "react";
import type { Components } from "react-markdown";

import { extractCatalogMeta } from "@/lib/catalogMeta";
import { slugifyHeading } from "@/lib/markdownToc";
import { parseWikiLinks, renderWikiLinksToMarkdown } from "@/lib/wikiLinks";

import RatingPanel from "@/app/wiki/[slug]/rating-panel";
import { auth } from "@/auth";
import ReportButton from "@/app/wiki/[slug]/report-client";

async function getArticle(slug: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/articles/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.article as {
    slug: string;
    title: string;
    isCanon: boolean;
    tags: string[];
    updatedAt: string;
    currentRevision: { revNumber: number; contentMd: string; createdAt: string } | null;
  };
}

async function resolveLinks(slugs: string[]) {
  // DB query directly for existence + titles
  const { prisma } = await import("@/lib/prisma");
  const rows: Array<{ slug: string; title: string }> = await prisma.article.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, title: true },
  });
  const existing = new Map(rows.map((r) => [r.slug, r.title] as const));
  const missing = slugs.filter((s) => !existing.has(s));
  return { existing, missing };
}

async function resolveBacklinks(slug: string) {
  const { prisma } = await import("@/lib/prisma");
  const needle = `[[${slug}]]`;
  const rows: Array<{ slug: string; title: string }> = await prisma.article.findMany({
    where: {
      slug: { not: slug },
      currentRevision: {
        contentMd: { contains: needle },
      },
    },
    select: { slug: true, title: true },
    take: 50,
    orderBy: { updatedAt: "desc" },
  });
  return rows;
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

export default async function WikiArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await auth();
  const viewerUserId = (session?.user as unknown as { id?: string } | null)?.id ?? null;

  const article = await getArticle(params.slug);
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
  const outgoing = parseWikiLinks(raw).filter((l) => l.slug !== article.slug);
  const slugs = outgoing.map((l) => l.slug);
  const resolved = slugs.length ? await resolveLinks(slugs) : null;
  const backlinks = await resolveBacklinks(article.slug);
  const renderedMd = renderWikiLinksToMarkdown(raw);

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

  const { prisma } = await import("@/lib/prisma");
  const approvedTagRows = article.tags?.length
    ? await prisma.tag.findMany({
        where: { key: { in: article.tags } },
        select: { key: true },
      })
    : [];
  const approvedTags = new Set(approvedTagRows.map((r) => r.key));

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">{article.title}</h1>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <div>
            /wiki/{article.slug} · rev {article.currentRevision?.revNumber ?? "?"}
          </div>
          <ReportButton targetType="ARTICLE" targetRef={article.slug} viewerUserId={viewerUserId} />
          <Link className="underline" href={`/wiki/${article.slug}/history`}>
            History
          </Link>
        </div>

        {article.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {article.tags.map((t) =>
              approvedTags.has(t) ? (
                <a
                  key={t}
                  href={`/?tag=${encodeURIComponent(t)}`}
                  className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] text-zinc-700 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  {t}
                </a>
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

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
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
          </dl>

          {!meta.designation && !meta.type && !meta.status ? (
            <p className="mt-3 text-xs text-zinc-500">
              Tip: include the “Header” bullets from `docs/ARTICLE_TEMPLATE.md` to populate this card.
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-950">
          <div className="text-xs font-medium tracking-wide text-zinc-500">RATING</div>
          <div className="mt-3">
            <RatingPanel slug={article.slug} />
          </div>
        </div>
      </section>

      <article className="prose prose-zinc max-w-none dark:prose-invert">
        <ReactMarkdown components={mdComponents}>{renderedMd}</ReactMarkdown>

        {resolved && (resolved.existing.size > 0 || resolved.missing.length > 0) ? (
          <div className="not-prose mt-10 rounded-2xl border border-black/10 bg-white p-5 text-sm dark:border-white/15 dark:bg-zinc-950">
            <div className="text-xs font-medium tracking-wide text-zinc-500">RELATED</div>
            <div className="mt-3 space-y-3">
              {resolved.existing.size > 0 ? (
                <div>
                  <div className="text-xs text-zinc-500">Known entries (outgoing)</div>
                  <ul className="mt-2 list-disc pl-5">
                    {Array.from(resolved.existing.entries()).map(([slug, title]) => (
                      <li key={slug}>
                        <a className="underline" href={`/wiki/${slug}`}>
                          {title}
                        </a>{" "}
                        <span className="text-xs text-zinc-500">/{slug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {resolved.missing.length > 0 ? (
                <div>
                  <div className="text-xs text-zinc-500">Uncataloged references (outgoing)</div>
                  <ul className="mt-2 list-disc pl-5">
                    {resolved.missing.map((slug) => (
                      <li key={slug}>
                        <a className="underline" href={`/wiki/${slug}`}>
                          [[{slug}]]
                        </a>{" "}
                        <span className="text-xs text-zinc-500">(not found)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {backlinks.length > 0 ? (
                <div>
                  <div className="text-xs text-zinc-500">Referenced by (incoming)</div>
                  <ul className="mt-2 list-disc pl-5">
                    {backlinks.map((b) => (
                      <li key={b.slug}>
                        <a className="underline" href={`/wiki/${b.slug}`}>
                          {b.title}
                        </a>{" "}
                        <span className="text-xs text-zinc-500">/{b.slug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </article>
    </main>
  );
}
