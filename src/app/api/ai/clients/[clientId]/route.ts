import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";
import { requireAiV1Available } from "@/lib/aiVersion";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ clientId: string }> },
) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const { clientId } = await ctx.params;
  const normalizedClientId = String(clientId ?? "").trim();
  if (!normalizedClientId) {
    return Response.json({ error: "clientId required" }, { status: 400 });
  }
  const url = new URL(req.url);
  const deleting =
    url.searchParams.get("delete") === "1" ||
    url.searchParams.get("delete") === "true" ||
    url.searchParams.get("permanent") === "1" ||
    url.searchParams.get("permanent") === "true";

  const row = await prisma.aiClient.findUnique({
    where: { clientId: normalizedClientId },
    select: {
      id: true,
      clientId: true,
      ownerUserId: true,
      status: true,
      revokedAt: true,
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
        clientId: row.clientId,
        deleted: true,
        alreadyDeleted: true,
      },
      { status: 410 },
    );
  }

  if (deleting) {
    if (!row.revokedAt) {
      return Response.json(
        { error: "Disable this AI client before deleting it" },
        { status: 400 },
      );
    }

    const deletedAt = new Date();
    await prisma.aiClient.update({
      where: { id: row.id },
      data: {
        deletedAt,
        pairCodeHash: null,
        pairCodeExpiresAt: null,
      },
    });

    return Response.json({
      ok: true,
      clientId: row.clientId,
      deleted: true,
      deletedAt: deletedAt.toISOString(),
    });
  }

  if (row.revokedAt) {
    return Response.json({
      ok: true,
      clientId: row.clientId,
      status: row.status,
      alreadyDisconnected: true,
      disconnectedAt: row.revokedAt.toISOString(),
    });
  }

  const now = new Date();
  const updated = await prisma.aiClient.update({
    where: { id: row.id },
    data: {
      revokedAt: now,
      pairCodeHash: null,
      pairCodeExpiresAt: null,
    },
    select: {
      clientId: true,
      status: true,
      revokedAt: true,
    },
  });

  return Response.json({
    ok: true,
    clientId: updated.clientId,
    status: updated.status,
    disconnectedAt: updated.revokedAt?.toISOString(),
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ clientId: string }> },
) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const { clientId } = await ctx.params;
  const normalizedClientId = String(clientId ?? "").trim();
  if (!normalizedClientId) {
    return Response.json({ error: "clientId required" }, { status: 400 });
  }

  const row = await prisma.aiClient.findUnique({
    where: { clientId: normalizedClientId },
    select: {
      id: true,
      clientId: true,
      ownerUserId: true,
      status: true,
      ownerConfirmedAt: true,
      revokedAt: true,
      deletedAt: true,
      aiAccount: {
        select: {
          deletedAt: true,
        },
      },
    },
  });

  if (!row || row.ownerUserId !== gate.userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (row.deletedAt) {
    return Response.json({ error: "AI client was deleted" }, { status: 410 });
  }
  if (row.aiAccount?.deletedAt) {
    return Response.json({ error: "AI account was deleted" }, { status: 410 });
  }

  if (!row.revokedAt) {
    return Response.json({
      ok: true,
      clientId: row.clientId,
      status: row.status,
      alreadyConnected: true,
    });
  }

  if (!row.ownerConfirmedAt) {
    return Response.json(
      { error: "This disconnected AI client must be registered again." },
      { status: 400 },
    );
  }

  const updated = await prisma.aiClient.update({
    where: { id: row.id },
    data: {
      revokedAt: null,
      status: "ACTIVE",
    },
    select: {
      clientId: true,
      status: true,
    },
  });

  return Response.json({
    ok: true,
    clientId: updated.clientId,
    status: updated.status,
    reconnectedAt: new Date().toISOString(),
  });
}
