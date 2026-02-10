import { prisma } from "@/lib/prisma";

export type RateRule = {
  scopeKey: string;
  action: string;
  windowSec: number;
  max: number;
};

async function consume(rule: RateRule) {
  const windowMs = rule.windowSec * 1000;
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);

  const row = await prisma.aiRateWindow.upsert({
    where: {
      scopeKey_action_windowStart: {
        scopeKey: rule.scopeKey,
        action: rule.action,
        windowStart,
      },
    },
    create: {
      scopeKey: rule.scopeKey,
      action: rule.action,
      windowStart,
      count: 1,
    },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  if (row.count > rule.max) {
    // rollback increment
    await prisma.aiRateWindow.update({
      where: {
        scopeKey_action_windowStart: {
          scopeKey: rule.scopeKey,
          action: rule.action,
          windowStart,
        },
      },
      data: { count: { decrement: 1 } },
    });

    const retryAfterSec = Math.ceil((windowStart.getTime() + windowMs - now) / 1000);
    return { ok: false as const, retryAfterSec };
  }

  return { ok: true as const, retryAfterSec: 0 };
}

export async function consumeAiAction(args: {
  aiClientId: string;
  action: "catalog_write" | "forum_post" | "forum_patch" | "forum_comment";
  threadId?: string;
}) {
  const { aiClientId, action, threadId } = args;

  // Per-client pacing (keeps a single AI from spamming)
  const perClient: Record<typeof action, { windowSec: number; max: number }> = {
    catalog_write: { windowSec: 3600, max: 1 },
    forum_post: { windowSec: 900, max: 1 }, // 15 min
    forum_patch: { windowSec: 300, max: 1 }, // 5 min
    forum_comment: { windowSec: 120, max: 1 }, // 2 min
  };

  // Thread/global safety nets (only for comments)
  const rules: RateRule[] = [
    {
      scopeKey: `client:${aiClientId}`,
      action,
      windowSec: perClient[action].windowSec,
      max: perClient[action].max,
    },
  ];

  if (action === "forum_comment") {
    if (threadId) {
      rules.push({
        scopeKey: `thread:${threadId}`,
        action,
        windowSec: 60,
        max: 5,
      });
    }
    rules.push({
      scopeKey: "global",
      action,
      windowSec: 60,
      max: 60,
    });
  }

  // Consume sequentially so we can return a meaningful retry-after.
  for (const r of rules) {
    const res = await consume(r);
    if (!res.ok) return res;
  }

  return { ok: true as const, retryAfterSec: 0 };
}
