import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";
import { requireAiV1Available } from "@/lib/aiVersion";

export async function GET(req: Request) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const items = await prisma.aiClient.findMany({
    where: { ownerUserId: gate.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      clientId: true,
      status: true,
      createdAt: true,
      ownerConfirmedAt: true,
      pairCodeExpiresAt: true,
      revokedAt: true,
    },
  });

  return Response.json({ items });
}
