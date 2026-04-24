import { unstable_cache } from "next/cache";

import { publicArticleWhere } from "@/lib/articleAccess";
import { pickBestArticleTranslation } from "@/lib/articleTranslation";
import { CACHE_TAGS } from "@/lib/cacheTags";
import { prisma } from "@/lib/prisma";
import { resolveSiteLocale } from "@/lib/site-locale";

export type PublicArticlesQuery = {
  query?: string;
  tag?: string;
  tags?: string[];
  type?: string;
  status?: string;
  locale?: string;
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
    locale: resolveSiteLocale(String(args.locale ?? "")),
  };
}

async function loadPublicArticles(args: PublicArticlesQuery) {
  const { query, tag, tags, type, status, locale } = normalizePublicArticlesQuery(args);
  const localePrimary = locale.split("-")[0] ?? locale;

  const where = query
    ? {
        OR: [
          { slug: { contains: query, mode: "insensitive" as const } },
          { title: { contains: query, mode: "insensitive" as const } },
          { translations: { some: { title: { contains: query, mode: "insensitive" as const } } } },
        ],
      }
    : {};

  const rows: Array<{
    slug: string;
    title: string;
    mainLanguage: string | null;
    currentRevisionId: string | null;
    updatedAt: Date;
    tags: string[];
    currentRevision: { contentMd: string } | null;
    translations: Array<{
      articleRevisionId: string;
      targetLanguage: string;
      title: string;
      contentMd: string;
      summary: string | null;
    }>;
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
      mainLanguage: true,
      currentRevisionId: true,
      updatedAt: true,
      tags: true,
      currentRevision: { select: { contentMd: true } },
      translations: {
        where: {
          OR: [
            { targetLanguage: locale },
            { targetLanguage: { startsWith: `${localePrimary}-`, mode: "insensitive" } },
          ],
        },
        orderBy: { targetLanguage: "asc" },
        select: {
          articleRevisionId: true,
          targetLanguage: true,
          title: true,
          contentMd: true,
          summary: true,
        },
      },
    },
  });

  const { getTypeStatus } = await import("@/lib/catalogHeader");

  return rows
    .map((row) => {
      const meta = row.currentRevision?.contentMd
        ? getTypeStatus(row.currentRevision.contentMd)
        : { type: null, status: null };
      const currentTranslations = row.translations.filter(
        (translation) => translation.articleRevisionId === row.currentRevisionId,
      );
      const translation = pickBestArticleTranslation(
        currentTranslations,
        locale,
        row.mainLanguage,
      );

      return {
        slug: row.slug,
        title: translation?.title ?? row.title,
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
