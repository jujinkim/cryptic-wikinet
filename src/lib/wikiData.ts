import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { pickBestArticleTranslation } from "@/lib/articleTranslation";
import { publicArticleWhere, PUBLIC_ARTICLE_LIFECYCLE } from "@/lib/articleAccess";
import { CACHE_TAGS } from "@/lib/cacheTags";
import { buildRenderedCatalogBody } from "@/lib/catalogBody";
import { extractCatalogMeta } from "@/lib/catalogMeta";
import type { TocItem } from "@/lib/markdownToc";
import { extractToc } from "@/lib/markdownToc";
import { prisma } from "@/lib/prisma";
import { resolveSiteLocale, type SiteLocale } from "@/lib/site-locale";

export type WikiNavTag = {
  key: string;
  label: string;
  count: number;
};

export type WikiPageRevisionForLocale = {
  contentMd: string;
  mainLanguage: string | null;
  translations: Array<{
    targetLanguage: string;
    title: string;
    contentMd: string;
  }>;
};

export function pickWikiPageContentMd(args: {
  locale: SiteLocale;
  articleMainLanguage: string | null;
  currentRevision: WikiPageRevisionForLocale | null | undefined;
}) {
  const revision = args.currentRevision;
  if (!revision) return "";

  const selectedTranslation = pickBestArticleTranslation(
    revision.translations,
    args.locale,
    args.articleMainLanguage ?? revision.mainLanguage,
  );

  return selectedTranslation?.contentMd ?? revision.contentMd;
}

async function loadWikiSidebarTags(): Promise<WikiNavTag[]> {
  const rows = await prisma.$queryRaw<WikiNavTag[]>(Prisma.sql`
    SELECT
      t."key" AS key,
      t."label" AS label,
      COALESCE(counts.count, 0)::int AS count
    FROM "Tag" t
    LEFT JOIN (
      SELECT
        article_tag.tag_key AS key,
        COUNT(DISTINCT a."id")::int AS count
      FROM "Article" a
      CROSS JOIN LATERAL unnest(a."tags") AS article_tag(tag_key)
      WHERE a."lifecycle" = ${PUBLIC_ARTICLE_LIFECYCLE}
      GROUP BY article_tag.tag_key
    ) counts
      ON counts.key = t."key"
    ORDER BY t."label" ASC
    LIMIT 300
  `);

  return rows;
}

async function loadPublicArticleToc(slug: string, locale: SiteLocale): Promise<TocItem[] | null> {
  const row = await prisma.article.findFirst({
    where: {
      slug,
      lifecycle: PUBLIC_ARTICLE_LIFECYCLE,
    },
    select: {
      mainLanguage: true,
      currentRevision: {
        select: {
          contentMd: true,
          mainLanguage: true,
          translations: {
            select: {
              targetLanguage: true,
              title: true,
              contentMd: true,
            },
          },
        },
      },
    },
  });

  if (!row) return null;
  const contentMd = pickWikiPageContentMd({
    locale,
    articleMainLanguage: row.mainLanguage,
    currentRevision: row.currentRevision,
  });
  if (!contentMd) return [];
  const meta = extractCatalogMeta(contentMd);
  return extractToc(buildRenderedCatalogBody(contentMd, meta.discovery));
}

async function loadPublicWikiPageData(slug: string, locale: SiteLocale): Promise<{
  toc: TocItem[];
  tags: string[];
} | null> {
  const row = await prisma.article.findFirst({
    where: {
      slug,
      ...publicArticleWhere(),
    },
    select: {
      mainLanguage: true,
      tags: true,
      currentRevision: {
        select: {
          contentMd: true,
          mainLanguage: true,
          translations: {
            select: {
              targetLanguage: true,
              title: true,
              contentMd: true,
            },
          },
        },
      },
    },
  });

  if (!row) return null;

  const contentMd = pickWikiPageContentMd({
    locale,
    articleMainLanguage: row.mainLanguage,
    currentRevision: row.currentRevision,
  });
  const meta = extractCatalogMeta(contentMd);

  return {
    toc: contentMd ? extractToc(buildRenderedCatalogBody(contentMd, meta.discovery)) : [],
    tags: row.tags ?? [],
  };
}

const getCachedWikiSidebarTagsInner = unstable_cache(loadWikiSidebarTags, ["wiki-sidebar-tags"], {
  revalidate: 300,
  tags: [CACHE_TAGS.wikiNav, CACHE_TAGS.tags, CACHE_TAGS.articles],
});

export async function getCachedWikiSidebarTags() {
  return getCachedWikiSidebarTagsInner();
}

export async function getCachedPublicArticleToc(slug: string) {
  return getCachedPublicArticleTocForLocale(slug, "en");
}

export async function getCachedPublicArticleTocForLocale(slug: string, locale: string) {
  const resolvedLocale = resolveSiteLocale(locale);
  return unstable_cache(
    async () => loadPublicArticleToc(slug, resolvedLocale),
    [`wiki-public-toc:${slug}:${resolvedLocale}`],
    {
      revalidate: 300,
      tags: [CACHE_TAGS.articles],
    },
  )();
}

export async function getCachedPublicWikiPageData(slug: string, locale: string = "en") {
  const resolvedLocale = resolveSiteLocale(locale);
  return unstable_cache(
    async () => loadPublicWikiPageData(slug, resolvedLocale),
    [`wiki-public-page:${slug}:${resolvedLocale}`],
    {
      revalidate: 300,
      tags: [CACHE_TAGS.articles],
    },
  )();
}
