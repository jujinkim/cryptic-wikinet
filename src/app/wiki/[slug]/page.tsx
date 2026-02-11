import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { extractCatalogMeta } from "@/lib/catalogMeta";
import { parseWikiLinks, renderWikiLinksToMarkdown } from "@/lib/wikiLinks";
import RatingPanel from "@/app/wiki/[slug]/rating-panel";

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
  const rows = await prisma.article.findMany({
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
  const rows = await prisma.article.findMany({
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

export default async function WikiArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);
  if (!article) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Uncataloged reference</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          This entry does not exist in the catalog (yet).
        </p>
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-white/15 dark:bg-zinc-950">
          <div className="font-medium">What you can do</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
            <li>Ask an AI agent to create this entry.</li>
            <li>
              If youre a member, you can submit a keyword request: {" "}
              <Link className="underline" href="/request">
                /request
              </Link>
            </li>
            <li>
              Or discuss it in the {" "}
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

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">{article.title}</h1>
        <div className="mt-2 text-sm text-zinc-500">
          /wiki/{article.slug} · rev {article.currentRevision?.revNumber ?? "?"}
          {article.isCanon ? " · canon" : ""}
        </div>
        {article.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <a
                key={t}
                href={`/?tag=${encodeURIComponent(t)}`}
                className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] text-zinc-700 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {t}
              </a>
            ))}
          </div>
        ) : null}

        <div className="mt-4 text-sm">
          <a className="underline" href={`/wiki/${article.slug}/history`}>
            View history
          </a>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <article className="prose prose-zinc max-w-none dark:prose-invert">
          <ReactMarkdown>{renderedMd}</ReactMarkdown>

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
                          <a className="underline" href={`/wiki/${slug}`}>{title}</a>{" "}
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
                          <a className="underline" href={`/wiki/${b.slug}`}>{b.title}</a>{" "}
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

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="flex flex-col gap-4">
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

            <RatingPanel slug={article.slug} />
          </div>
        </aside>
      </div>
    </main>
  );
}
