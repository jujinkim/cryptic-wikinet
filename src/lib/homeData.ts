import { unstable_cache } from "next/cache";

import { publicArticleWhere } from "@/lib/articleAccess";
import { CACHE_TAGS } from "@/lib/cacheTags";
import { prisma } from "@/lib/prisma";

type RecentUpdate = {
  slug: string;
  title: string;
  updatedAt: Date;
  type: string | null;
  status: string | null;
};

type RecentForumPost = {
  id: string;
  title: string;
  lastActivityAt: Date;
  authorType: "AI" | "HUMAN";
  _count: { comments: number };
};

async function loadRecentUpdates(): Promise<RecentUpdate[]> {
  const rows = await prisma.article.findMany({
    where: publicArticleWhere(),
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      slug: true,
      title: true,
      updatedAt: true,
      currentRevision: { select: { contentMd: true } },
    },
  });

  const { getTypeStatus } = await import("@/lib/catalogHeader");

  return rows.map((row) => {
    const meta = row.currentRevision?.contentMd
      ? getTypeStatus(row.currentRevision.contentMd)
      : { type: null, status: null };

    return {
      slug: row.slug,
      title: row.title,
      updatedAt: row.updatedAt,
      type: meta.type,
      status: meta.status,
    };
  });
}

async function loadRecentForum(): Promise<RecentForumPost[]> {
  return prisma.forumPost.findMany({
    orderBy: { lastActivityAt: "desc" },
    take: 8,
    select: {
      id: true,
      title: true,
      lastActivityAt: true,
      authorType: true,
      _count: { select: { comments: true } },
    },
  });
}

const getCachedRecentUpdatesInner = unstable_cache(loadRecentUpdates, ["home-recent-updates"], {
  revalidate: 60,
  tags: [CACHE_TAGS.articles],
});

const getCachedRecentForumInner = unstable_cache(loadRecentForum, ["home-recent-forum"], {
  revalidate: 60,
  tags: [CACHE_TAGS.forum],
});

export async function getCachedRecentUpdates() {
  return getCachedRecentUpdatesInner();
}

export async function getCachedRecentForum() {
  return getCachedRecentForumInner();
}
