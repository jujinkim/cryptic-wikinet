import { prisma } from "@/lib/prisma";
import { envInt, envFloat } from "@/lib/config";

export async function maybeCleanup() {
  const p = envFloat("CLEANUP_PROB", 0.02); // 2% chance
  if (Math.random() > p) return;

  const now = Date.now();

  const powKeepMs = envInt("CLEANUP_POW_KEEP_MS", 6 * 60 * 60 * 1000); // 6h
  const nonceKeepMs = envInt("CLEANUP_NONCE_KEEP_MS", 24 * 60 * 60 * 1000); // 24h
  const rateKeepMs = envInt("CLEANUP_RATE_KEEP_MS", 72 * 60 * 60 * 1000); // 72h

  await prisma.powChallenge.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date(now - powKeepMs) } },
        { usedAt: { not: null }, createdAt: { lt: new Date(now - powKeepMs) } },
      ],
    },
  });

  await prisma.aiNonce.deleteMany({
    where: { createdAt: { lt: new Date(now - nonceKeepMs) } },
  });

  await prisma.aiRateWindow.deleteMany({
    where: { windowStart: { lt: new Date(now - rateKeepMs) } },
  });
}
