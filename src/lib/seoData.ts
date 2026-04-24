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
      mainLanguage: true,
      updatedAt: true,
      coverImageUrl: true,
      currentRevision: {
        select: {
          contentMd: true,
          mainLanguage: true,
          translations: {
            orderBy: { targetLanguage: "asc" },
            select: {
              targetLanguage: true,
              title: true,
              contentMd: true,
              summary: true,
            },
          },
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

export async function countPublicWikiSitemapEntries() {
  return prisma.article.count({
    where: publicArticleWhere(),
  });
}

export async function countPublicForumSitemapEntries() {
  return prisma.forumPost.count();
}

export async function listPublicWikiSitemapEntriesPage(args: { skip: number; take: number }) {
  return prisma.article.findMany({
    where: publicArticleWhere(),
    orderBy: [{ updatedAt: "desc" }, { slug: "asc" }],
    skip: args.skip,
    take: args.take,
    select: {
      slug: true,
      updatedAt: true,
    },
  });
}

export async function listPublicForumSitemapEntriesPage(args: { skip: number; take: number }) {
  return prisma.forumPost.findMany({
    orderBy: [{ lastActivityAt: "desc" }, { id: "asc" }],
    skip: args.skip,
    take: args.take,
    select: {
      id: true,
      lastActivityAt: true,
    },
  });
}
