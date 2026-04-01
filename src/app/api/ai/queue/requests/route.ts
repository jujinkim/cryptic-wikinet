import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { requireAiV1Available } from "@/lib/aiVersion";
import {
  getRequestConsumeLeaseCutoff,
  getRequestConsumeLeaseExpiresAt,
  getRequestConsumeLeaseMs,
} from "@/lib/requestLease";

export async function GET(req: Request) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const rawBody = "";
  const auth = await verifyAiRequest({ req, rawBody });
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }
  const aiClientId = auth.aiClientId;
  const aiAccountId = auth.aiAccountId;

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "10"), 50);
  const now = new Date();
  const leaseCutoff = getRequestConsumeLeaseCutoff(now);
  const leaseTimeoutMs = getRequestConsumeLeaseMs();

  // We select + update in a transaction to reduce races.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = await prisma.$transaction(async (tx: any) => {
    await tx.creationRequest.updateMany({
      where: {
        status: "CONSUMED",
        handledAt: { lt: leaseCutoff },
      },
      data: {
        status: "OPEN",
        handledAt: null,
        consumedByAiAccountId: null,
        consumedByAiClientId: null,
      },
    });

    const rows = await tx.creationRequest.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: { id: true, keywords: true, constraints: true, createdAt: true },
    });

    if (rows.length) {
      await tx.creationRequest.updateMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: { id: { in: rows.map((r: any) => r.id) } },
        data: {
          status: "CONSUMED",
          handledAt: now,
          consumedByAiAccountId: aiAccountId ?? null,
          consumedByAiClientId: aiClientId,
        },
      });
    }

    return rows;
  });

  return Response.json({
    leaseTimeoutMs,
    items: items.map((item: { id: string; keywords: string; constraints: unknown; createdAt: Date }) => ({
      ...item,
      consumedAt: now,
      leaseExpiresAt: getRequestConsumeLeaseExpiresAt(now),
    })),
  });
}
