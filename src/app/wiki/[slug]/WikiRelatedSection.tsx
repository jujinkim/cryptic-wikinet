import Link from "next/link";
import type { Prisma, UserRole } from "@prisma/client";

import { readableArticleWhereForUser } from "@/lib/articleAccess";
import { prisma } from "@/lib/prisma";
import { parseWikiLinks } from "@/lib/wikiLinks";

type Viewer = {
  userId: string | null;
  role: UserRole | null;
};

async function resolveLinks(slugs: string[], readableWhere: Prisma.ArticleWhereInput) {
  const rows: Array<{ slug: string; title: string }> = await prisma.article.findMany({
    where: { slug: { in: slugs }, ...readableWhere },
    select: { slug: true, title: true },
  });
  const existing = new Map(rows.map((row) => [row.slug, row.title] as const));
  const missing = slugs.filter((slug) => !existing.has(slug));
  return { existing, missing };
}

async function resolveBacklinks(slug: string, readableWhere: Prisma.ArticleWhereInput) {
  const needle = `[[${slug}]]`;
  const rows: Array<{ slug: string; title: string }> = await prisma.article.findMany({
    where: {
      ...readableWhere,
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

export default async function WikiRelatedSection(props: {
  slug: string;
  raw: string;
  viewer: Viewer;
}) {
  const readableWhere = readableArticleWhereForUser(props.viewer);
  const outgoing = parseWikiLinks(props.raw).filter((link) => link.slug !== props.slug);
  const slugs = outgoing.map((link) => link.slug);

  const [resolved, backlinks] = await Promise.all([
    slugs.length ? resolveLinks(slugs, readableWhere) : null,
    resolveBacklinks(props.slug, readableWhere),
  ]);

  if (!resolved && backlinks.length === 0) {
    return null;
  }

  if (resolved && resolved.existing.size === 0 && resolved.missing.length === 0 && backlinks.length === 0) {
    return null;
  }

  return (
    <div className="not-prose mt-10 rounded-2xl border border-black/10 bg-white p-5 text-sm dark:border-white/15 dark:bg-zinc-950">
      <div className="text-xs font-medium tracking-wide text-zinc-500">RELATED</div>
      <div className="mt-3 space-y-3">
        {resolved && resolved.existing.size > 0 ? (
          <div>
            <div className="text-xs text-zinc-500">Known entries (outgoing)</div>
            <ul className="mt-2 list-disc pl-5">
              {Array.from(resolved.existing.entries()).map(([slug, title]) => (
                <li key={slug}>
                  <Link className="underline" href={`/wiki/${slug}`}>
                    {title}
                  </Link>{" "}
                  <span className="text-xs text-zinc-500">/{slug}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {resolved && resolved.missing.length > 0 ? (
          <div>
            <div className="text-xs text-zinc-500">Uncataloged references (outgoing)</div>
            <ul className="mt-2 list-disc pl-5">
              {resolved.missing.map((slug) => (
                <li key={slug}>
                  <Link className="underline" href={`/wiki/${slug}`}>
                    [[{slug}]]
                  </Link>{" "}
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
              {backlinks.map((row) => (
                <li key={row.slug}>
                  <Link className="underline" href={`/wiki/${row.slug}`}>
                    {row.title}
                  </Link>{" "}
                  <span className="text-xs text-zinc-500">/{row.slug}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
