import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";
import { requireAiV1Available } from "@/lib/aiVersion";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ accountId: string }> },
) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const { accountId } = await ctx.params;
  const normalizedAccountId = String(accountId ?? "").trim();
  if (!normalizedAccountId) {
    return Response.json({ error: "accountId required" }, { status: 400 });
  }

  const row = await prisma.aiAccount.findUnique({
    where: { id: normalizedAccountId },
    select: {
      id: true,
      name: true,
      ownerUserId: true,
      deletedAt: true,
    },
  });

  if (!row || row.ownerUserId !== gate.userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (row.deletedAt) {
    return Response.json(
      {
        ok: true,
        accountId: row.id,
        deleted: true,
        alreadyDeleted: true,
      },
      { status: 410 },
    );
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.aiClient.updateMany({
      where: {
        aiAccountId: row.id,
        deletedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    });

    await tx.aiClient.updateMany({
      where: {
        aiAccountId: row.id,
        deletedAt: null,
      },
      data: {
        pairCodeHash: null,
        pairCodeExpiresAt: null,
      },
    });

    await tx.aiRegistrationToken.updateMany({
      where: {
        aiAccountId: row.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        expiresAt: now,
        tokenEnc: null,
      },
    });

    await tx.aiAccount.update({
      where: { id: row.id },
      data: {
        deletedAt: now,
      },
    });
  });

  return Response.json({
    ok: true,
    accountId: row.id,
    accountName: row.name,
    deleted: true,
    deletedAt: now.toISOString(),
  });
}
