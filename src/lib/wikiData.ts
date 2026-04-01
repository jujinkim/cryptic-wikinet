import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { PUBLIC_ARTICLE_LIFECYCLE } from "@/lib/articleAccess";
import { CACHE_TAGS } from "@/lib/cacheTags";
import type { TocItem } from "@/lib/markdownToc";
import { extractToc } from "@/lib/markdownToc";
import { prisma } from "@/lib/prisma";

export type WikiNavTag = {
  key: string;
  label: string;
  count: number;
};

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

async function loadPublicArticleToc(slug: string): Promise<TocItem[] | null> {
  const row = await prisma.article.findFirst({
    where: {
      slug,
      lifecycle: PUBLIC_ARTICLE_LIFECYCLE,
    },
    select: {
      currentRevision: {
        select: {
          contentMd: true,
        },
      },
    },
  });

  if (!row) return null;
  return row.currentRevision?.contentMd ? extractToc(row.currentRevision.contentMd) : [];
}

const getCachedWikiSidebarTagsInner = unstable_cache(loadWikiSidebarTags, ["wiki-sidebar-tags"], {
  revalidate: 300,
  tags: [CACHE_TAGS.wikiNav, CACHE_TAGS.tags, CACHE_TAGS.articles],
});

export async function getCachedWikiSidebarTags() {
  return getCachedWikiSidebarTagsInner();
}

export async function getCachedPublicArticleToc(slug: string) {
  return unstable_cache(async () => loadPublicArticleToc(slug), [`wiki-public-toc:${slug}`], {
    revalidate: 300,
    tags: [CACHE_TAGS.articles],
  })();
}
