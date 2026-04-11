import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";
import { requireAiV1Available } from "@/lib/aiVersion";

export async function GET(req: Request) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const [items, rewardByAccount] = await Promise.all([
    prisma.aiAccount.findMany({
      where: { ownerUserId: gate.userId, deletedAt: null },
      orderBy: [{ lastActivityAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastActivityAt: true,
        clients: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            clientId: true,
            status: true,
            createdAt: true,
            lastActivityAt: true,
            ownerConfirmedAt: true,
            pairCodeExpiresAt: true,
            revokedAt: true,
          },
        },
      },
    }),
    prisma.memberRewardEvent.groupBy({
      by: ["aiAccountId", "status"],
      where: { ownerUserId: gate.userId, aiAccountId: { not: null } },
      _sum: { points: true },
      _count: { _all: true },
    }),
  ]);

  const rewardByAccountMap = new Map<
    string,
    { confirmedPoints: number; pendingPoints: number; confirmedWorks: number; pendingWorks: number }
  >();
  for (const row of rewardByAccount) {
    if (!row.aiAccountId) continue;
    const existing = rewardByAccountMap.get(row.aiAccountId) ?? {
      confirmedPoints: 0,
      pendingPoints: 0,
      confirmedWorks: 0,
      pendingWorks: 0,
    };
    if (row.status === "CONFIRMED") {
      existing.confirmedPoints = row._sum.points ?? 0;
      existing.confirmedWorks = row._count._all;
    }
    if (row.status === "PENDING") {
      existing.pendingPoints = row._sum.points ?? 0;
      existing.pendingWorks = row._count._all;
    }
    rewardByAccountMap.set(row.aiAccountId, existing);
  }

  return Response.json({
    items: items.map((account) => ({
      id: account.id,
      name: account.name,
      createdAt: account.createdAt.toISOString(),
      lastActivityAt: account.lastActivityAt ? account.lastActivityAt.toISOString() : null,
      clientCount: account.clients.length,
      reward: rewardByAccountMap.get(account.id) ?? {
        confirmedPoints: 0,
        pendingPoints: 0,
        confirmedWorks: 0,
        pendingWorks: 0,
      },
      clients: account.clients.map((client) => ({
        id: client.id,
        name: client.name,
        clientId: client.clientId,
        status: client.status,
        createdAt: client.createdAt.toISOString(),
        lastActivityAt: client.lastActivityAt ? client.lastActivityAt.toISOString() : null,
        ownerConfirmedAt: client.ownerConfirmedAt ? client.ownerConfirmedAt.toISOString() : null,
        pairCodeExpiresAt: client.pairCodeExpiresAt ? client.pairCodeExpiresAt.toISOString() : null,
        revokedAt: client.revokedAt ? client.revokedAt.toISOString() : null,
      })),
    })),
  });
}
