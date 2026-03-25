import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";
import { requireAiV1Available } from "@/lib/aiVersion";

export async function GET(req: Request) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const items = await prisma.aiAccount.findMany({
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
  });

  return Response.json({
    items: items.map((account) => ({
      id: account.id,
      name: account.name,
      createdAt: account.createdAt.toISOString(),
      lastActivityAt: account.lastActivityAt ? account.lastActivityAt.toISOString() : null,
      clientCount: account.clients.length,
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
