import { prisma } from "@/lib/prisma";
import { envInt } from "@/lib/config";
import {
  OWNER_ONLY_ARCHIVED_ARTICLE_LIFECYCLE,
  PUBLIC_ARTICLE_LIFECYCLE,
} from "@/lib/articleAccess";
import { deleteArticleCoverImage } from "@/lib/articleCoverImage";

const DAY_MS = 24 * 60 * 60 * 1000;

export function articleRetentionWindowDays() {
  return Math.max(1, envInt("ARTICLE_RETENTION_WINDOW_DAYS", 30));
}

export function articleRetentionMinGoodRatings() {
  return Math.max(0, envInt("ARTICLE_RETENTION_MIN_GOOD_RATINGS", 3));
}

export function articleRetentionBatchSize() {
  return Math.max(1, envInt("ARTICLE_RETENTION_BATCH_SIZE", 25));
}

export async function runArticleRetentionSweep(args?: {
  now?: Date;
  limit?: number;
}) {
  const now = args?.now ?? new Date();
  const windowDays = articleRetentionWindowDays();
  const minGoodRatings = articleRetentionMinGoodRatings();
  const limit = Math.max(1, args?.limit ?? articleRetentionBatchSize());
  const cutoff = new Date(now.getTime() - windowDays * DAY_MS);

  const due = await prisma.article.findMany({
    where: {
      lifecycle: PUBLIC_ARTICLE_LIFECYCLE,
      retentionEvaluatedAt: null,
      createdAt: { lte: cutoff },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      createdAt: true,
      coverImageUrl: true,
      coverImagePath: true,
    },
  });

  let kept = 0;
  let archived = 0;
  const items: Array<{ slug: string; goodCount: number; action: "KEPT" | "ARCHIVED" }> = [];

  for (const article of due) {
    const goodCount = await prisma.rating.count({
      where: {
        articleId: article.id,
        verdict: "GOOD",
      },
    });

    const shouldArchive = goodCount < minGoodRatings;

    if (shouldArchive) {
      await deleteArticleCoverImage(article.coverImagePath ?? article.coverImageUrl);
    }

    await prisma.article.update({
      where: { id: article.id },
      data: shouldArchive
        ? {
            isPublic: false,
            lifecycle: OWNER_ONLY_ARCHIVED_ARTICLE_LIFECYCLE,
            coverImageUrl: null,
            coverImagePath: null,
            coverImageWidth: null,
            coverImageHeight: null,
            coverImageByteSize: null,
            retentionEvaluatedAt: now,
            retentionGoodCount: goodCount,
            archivedAt: now,
          }
        : {
            isPublic: true,
            lifecycle: PUBLIC_ARTICLE_LIFECYCLE,
            retentionEvaluatedAt: now,
            retentionGoodCount: goodCount,
          },
    });

    if (shouldArchive) {
      archived += 1;
    } else {
      kept += 1;
    }

    items.push({
      slug: article.slug,
      goodCount,
      action: shouldArchive ? "ARCHIVED" : "KEPT",
    });
  }

  return {
    evaluated: due.length,
    kept,
    archived,
    minGoodRatings,
    windowDays,
    cutoffAt: cutoff.toISOString(),
    items,
  };
}
