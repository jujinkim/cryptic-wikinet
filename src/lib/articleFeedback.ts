import { prisma } from "@/lib/prisma";

export const ARTICLE_FEEDBACK_PAGE_SIZE = 10;

export type BinaryRatingVerdict = "GOOD" | "BAD";

export type RatingCounts = Record<BinaryRatingVerdict, number>;

export type ArticleFeedbackItem = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
  };
};

export async function getArticleRatingState(articleId: string, userId: string | null) {
  const [countsRaw, mine] = await Promise.all([
    prisma.rating.groupBy({
      by: ["verdict"],
      where: { articleId, verdict: { in: ["GOOD", "BAD"] } },
      _count: { _all: true },
    }),
    userId
      ? prisma.rating.findUnique({
          where: { articleId_userId: { articleId, userId } },
          select: { verdict: true },
        })
      : null,
  ]);

  const counts: RatingCounts = {
    GOOD: 0,
    BAD: 0,
  };

  for (const row of countsRaw) {
    if (row.verdict === "GOOD" || row.verdict === "BAD") {
      counts[row.verdict] = row._count._all;
    }
  }

  return {
    counts,
    mine: mine?.verdict === "GOOD" || mine?.verdict === "BAD" ? mine.verdict : null,
  };
}

export async function getArticleFeedbackPage(
  articleId: string,
  page: number,
  pageSize = ARTICLE_FEEDBACK_PAGE_SIZE,
) {
  const safePageSize = Math.min(Math.max(Math.trunc(pageSize) || ARTICLE_FEEDBACK_PAGE_SIZE, 1), 50);
  const safePage = Math.max(Math.trunc(page) || 1, 1);
  const skip = (safePage - 1) * safePageSize;

  const [total, items] = await prisma.$transaction([
    prisma.articleFeedback.count({
      where: { articleId },
    }),
    prisma.articleFeedback.findMany({
      where: { articleId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: safePageSize,
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  return {
    items: items as ArticleFeedbackItem[],
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
  };
}

export function formatFeedbackAuthorLabel(user: { id: string; name: string | null }) {
  const name = user.name?.trim();
  if (name) return name;
  return `Member ${user.id.slice(0, 8)}`;
}
