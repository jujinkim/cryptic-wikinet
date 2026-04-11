import { prisma } from "@/lib/prisma";
import { envInt } from "@/lib/config";

const MEMBER_REWARD_TIERS = [
  { key: "observer", minPoints: 0 },
  { key: "archivist", minPoints: 50 },
  { key: "curator", minPoints: 150 },
  { key: "cartographer", minPoints: 300 },
] as const;

export type MemberRewardTierKey = (typeof MEMBER_REWARD_TIERS)[number]["key"];

export function memberRewardRequestArticlePoints() {
  return Math.max(1, envInt("MEMBER_REWARD_REQUEST_ARTICLE_POINTS", 10));
}

export function memberRewardConfirmDelayHours() {
  return Math.max(1, envInt("MEMBER_REWARD_CONFIRM_DELAY_HOURS", 72));
}

export function memberRewardSweepBatchSize() {
  return Math.max(1, envInt("MEMBER_REWARD_SWEEP_BATCH_SIZE", 25));
}

export function getMemberRewardEligibleAt(now: Date) {
  return new Date(now.getTime() + memberRewardConfirmDelayHours() * 60 * 60 * 1000);
}

export function getMemberRewardTier(points: number): {
  key: MemberRewardTierKey;
  nextKey: MemberRewardTierKey | null;
  nextMinPoints: number | null;
  pointsToNext: number;
} {
  let current: (typeof MEMBER_REWARD_TIERS)[number] = MEMBER_REWARD_TIERS[0]!;
  for (const tier of MEMBER_REWARD_TIERS) {
    if (points >= tier.minPoints) current = tier;
  }
  const currentIndex = MEMBER_REWARD_TIERS.findIndex((tier) => tier.key === current.key);
  const next = MEMBER_REWARD_TIERS[currentIndex + 1] ?? null;
  return {
    key: current.key,
    nextKey: next?.key ?? null,
    nextMinPoints: next?.minPoints ?? null,
    pointsToNext: next ? Math.max(0, next.minPoints - points) : 0,
  };
}

export async function runMemberRewardSweep(args?: { now?: Date; limit?: number }) {
  const now = args?.now ?? new Date();
  const limit = args?.limit ?? memberRewardSweepBatchSize();
  const pending = await prisma.memberRewardEvent.findMany({
    where: {
      status: "PENDING",
      eligibleAt: { lte: now },
    },
    orderBy: [{ eligibleAt: "asc" }, { createdAt: "asc" }],
    take: limit,
    select: {
      id: true,
      articleId: true,
    },
  });

  if (pending.length === 0) {
    return { scanned: 0, confirmed: 0, canceled: 0 };
  }

  const articleIds = pending
    .map((event) => event.articleId)
    .filter((articleId): articleId is string => !!articleId);

  const articles = articleIds.length
    ? await prisma.article.findMany({
        where: { id: { in: articleIds } },
        select: { id: true, isPublic: true, lifecycle: true },
      })
    : [];
  const activeArticleIds = new Set(
    articles
      .filter((article) => article.isPublic && article.lifecycle === "PUBLIC_ACTIVE")
      .map((article) => article.id),
  );

  let confirmed = 0;
  let canceled = 0;
  const results = await prisma.$transaction(
    pending.map((event) => {
      const shouldConfirm = !!event.articleId && activeArticleIds.has(event.articleId);
      return prisma.memberRewardEvent.updateMany({
        where: { id: event.id, status: "PENDING" },
        data: shouldConfirm
          ? { status: "CONFIRMED", confirmedAt: now, canceledAt: null }
          : { status: "CANCELED", canceledAt: now, confirmedAt: null },
      });
    }),
  );

  results.forEach((result, index) => {
    if (result.count === 0) return;
    const event = pending[index];
    if (event?.articleId && activeArticleIds.has(event.articleId)) {
      confirmed += 1;
    } else {
      canceled += 1;
    }
  });

  return { scanned: pending.length, confirmed, canceled };
}
