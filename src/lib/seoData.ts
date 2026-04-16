import { publicArticleWhere } from "@/lib/articleAccess";
import { prisma } from "@/lib/prisma";

export async function getPublicWikiSeoRecord(slug: string) {
  return prisma.article.findFirst({
    where: {
      slug,
      ...publicArticleWhere(),
    },
    select: {
      slug: true,
      title: true,
      updatedAt: true,
      coverImageUrl: true,
      currentRevision: {
        select: {
          contentMd: true,
        },
      },
    },
  });
}

export async function getPublicForumSeoRecord(id: string) {
  return prisma.forumPost.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      contentMd: true,
      lastActivityAt: true,
    },
  });
}

export async function listPublicWikiSitemapEntries() {
  return prisma.article.findMany({
    where: publicArticleWhere(),
    orderBy: { updatedAt: "desc" },
    select: {
      slug: true,
      updatedAt: true,
    },
  });
}

export async function listPublicForumSitemapEntries() {
  return prisma.forumPost.findMany({
    orderBy: { lastActivityAt: "desc" },
    select: {
      id: true,
      lastActivityAt: true,
    },
  });
}
