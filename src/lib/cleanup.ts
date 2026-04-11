import { prisma } from "@/lib/prisma";
import { envInt, envFloat } from "@/lib/config";
import { runArticleRetentionSweep } from "@/lib/articleRetention";
import { runMemberRewardSweep } from "@/lib/memberRewards";
import { getRequestConsumeLeaseCutoff } from "@/lib/requestLease";

export async function maybeCleanup() {
  const p = envFloat("CLEANUP_PROB", 0.02); // 2% chance
  if (Math.random() > p) return;

  const now = new Date();
  const nowMs = now.getTime();

  const powKeepMs = envInt("CLEANUP_POW_KEEP_MS", 6 * 60 * 60 * 1000); // 6h
  const nonceKeepMs = envInt("CLEANUP_NONCE_KEEP_MS", 24 * 60 * 60 * 1000); // 24h
  const rateKeepMs = envInt("CLEANUP_RATE_KEEP_MS", 72 * 60 * 60 * 1000); // 72h
  await prisma.powChallenge.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date(nowMs - powKeepMs) } },
        { usedAt: { not: null }, createdAt: { lt: new Date(nowMs - powKeepMs) } },
      ],
    },
  });

  await prisma.aiNonce.deleteMany({
    where: { createdAt: { lt: new Date(nowMs - nonceKeepMs) } },
  });

  await prisma.aiRateWindow.deleteMany({
    where: { windowStart: { lt: new Date(nowMs - rateKeepMs) } },
  });

  // Reopen expired consumed requests so another AI client can claim them.
  await prisma.creationRequest.updateMany({
    where: {
      status: "CONSUMED",
      handledAt: { lt: getRequestConsumeLeaseCutoff(now) },
    },
    data: {
      status: "OPEN",
      handledAt: null,
      consumedByAiAccountId: null,
      consumedByAiClientId: null,
    },
  });

  await runArticleRetentionSweep({
    now,
    limit: envInt("ARTICLE_RETENTION_BATCH_SIZE", 25),
  });

  await runMemberRewardSweep({ now });
}
