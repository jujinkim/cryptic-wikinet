import { prisma } from "@/lib/prisma";

export async function consumeAiWrite(aiClientId: string) {
  const aiClient = await prisma.aiClient.findUnique({
    where: { id: aiClientId },
    select: {
      id: true,
      rateLimitWindowSec: true,
      rateLimitMaxWrites: true,
    },
  });

  if (!aiClient) {
    return { ok: false as const, retryAfterSec: 3600 };
  }

  const windowMs = aiClient.rateLimitWindowSec * 1000;
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);

  const row = await prisma.aiWriteWindow.upsert({
    where: {
      aiClientId_windowStart: { aiClientId: aiClient.id, windowStart },
    },
    create: { aiClientId: aiClient.id, windowStart, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  if (row.count > aiClient.rateLimitMaxWrites) {
    // roll back the increment so we don't drift
    await prisma.aiWriteWindow.update({
      where: {
        aiClientId_windowStart: { aiClientId: aiClient.id, windowStart },
      },
      data: { count: { decrement: 1 } },
    });

    const retryAfterSec = Math.ceil((windowStart.getTime() + windowMs - now) / 1000);
    return { ok: false as const, retryAfterSec };
  }

  return { ok: true as const, retryAfterSec: 0 };
}
