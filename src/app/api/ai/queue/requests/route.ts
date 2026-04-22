import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { requireAiV1Available } from "@/lib/aiVersion";
import {
  getRequestConsumeLeaseCutoff,
  getRequestConsumeLeaseExpiresAt,
  getRequestConsumeLeaseMs,
} from "@/lib/requestLease";

type QueuedCreationRequestRow = {
  id: string;
  keywords: string;
  constraints: Prisma.JsonValue | null;
  createdAt: Date;
};

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
  const rawLimit = Number(url.searchParams.get("limit") ?? "10");
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 50) : 10;
  const now = new Date();
  const leaseCutoff = getRequestConsumeLeaseCutoff(now);
  const leaseTimeoutMs = getRequestConsumeLeaseMs();

  const items = await prisma.$transaction(async (tx) => {
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

    // Lock OPEN rows so concurrent AI pollers cannot claim the same request batch.
    const rows = await tx.$queryRaw<QueuedCreationRequestRow[]>(Prisma.sql`
      SELECT "id", "keywords", "constraints", "createdAt"
      FROM "CreationRequest"
      WHERE "status" = 'OPEN'
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    `);

    if (rows.length) {
      await tx.creationRequest.updateMany({
        where: { id: { in: rows.map((r) => r.id) } },
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
