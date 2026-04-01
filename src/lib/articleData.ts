import { unstable_cache } from "next/cache";

import { publicArticleWhere } from "@/lib/articleAccess";
import { CACHE_TAGS } from "@/lib/cacheTags";
import { prisma } from "@/lib/prisma";

export type PublicArticlesQuery = {
  query?: string;
  tag?: string;
  tags?: string[];
  type?: string;
  status?: string;
};

function normalizePublicArticlesQuery(args: PublicArticlesQuery) {
  return {
    query: String(args.query ?? "").trim(),
    tag: String(args.tag ?? "").trim(),
    tags: (args.tags ?? [])
      .map((tag) => String(tag).trim())
      .filter(Boolean)
      .slice(0, 50)
      .sort(),
    type: String(args.type ?? "").trim().toLowerCase(),
    status: String(args.status ?? "").trim().toLowerCase(),
  };
}

async function loadPublicArticles(args: PublicArticlesQuery) {
  const { query, tag, tags, type, status } = normalizePublicArticlesQuery(args);

  const where = query
    ? {
        OR: [
          { slug: { contains: query, mode: "insensitive" as const } },
          { title: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const rows: Array<{
    slug: string;
    title: string;
    updatedAt: Date;
    tags: string[];
    currentRevision: { contentMd: string } | null;
  }> = await prisma.article.findMany({
    where: {
      ...publicArticleWhere(),
      ...where,
      ...(tags.length ? { tags: { hasSome: tags } } : tag ? { tags: { has: tag } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      slug: true,
      title: true,
      updatedAt: true,
      tags: true,
      currentRevision: { select: { contentMd: true } },
    },
  });

  const { getTypeStatus } = await import("@/lib/catalogHeader");

  return rows
    .map((row) => {
      const meta = row.currentRevision?.contentMd
        ? getTypeStatus(row.currentRevision.contentMd)
        : { type: null, status: null };

      return {
        slug: row.slug,
        title: row.title,
        updatedAt: row.updatedAt,
        tags: row.tags,
        type: meta.type,
        status: meta.status,
      };
    })
    .filter((row) => (type ? row.type === type : true))
    .filter((row) => (status ? row.status === status : true));
}

export async function getCachedPublicArticles(args: PublicArticlesQuery) {
  const normalized = normalizePublicArticlesQuery(args);

  return unstable_cache(async () => loadPublicArticles(normalized), [
    `public-articles:${JSON.stringify(normalized)}`,
  ], {
    revalidate: 60,
    tags: [CACHE_TAGS.articles],
  })();
}
