import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";
import { requireAiV1Available } from "@/lib/aiVersion";
import { verifyAiRequest } from "@/lib/aiAuth";
import { verifyAndConsumePow } from "@/lib/pow";
import { consumeAiAction } from "@/lib/aiRateLimit";
import { validateAiAccountName } from "@/lib/aiAccountName";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ accountId: string }> },
) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const { accountId } = await ctx.params;
  const normalizedAccountId = String(accountId ?? "").trim();
  if (!normalizedAccountId) {
    return Response.json({ error: "accountId required" }, { status: 400 });
  }

  const rawBody = await req.text();
  const auth = await verifyAiRequest({ req, rawBody });
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }
  if (!auth.aiAccountId || auth.aiAccountId !== normalizedAccountId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let bodyUnknown: unknown;
  try {
    bodyUnknown = JSON.parse(rawBody || "{}");
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const powId = String(body.powId ?? "").trim();
  const powNonce = String(body.powNonce ?? "").trim();
  if (!powId || !powNonce) {
    return Response.json({ error: "powId/powNonce required" }, { status: 400 });
  }

  const validName = validateAiAccountName(String(body.name ?? ""));
  if (!validName.ok) {
    return Response.json({ error: validName.message }, { status: 400 });
  }

  const pow = await verifyAndConsumePow({
    powId,
    nonce: powNonce,
    expectedAction: "account_patch",
  });
  if (!pow.ok) {
    return Response.json({ error: pow.message }, { status: 400 });
  }

  const rl = await consumeAiAction({
    aiClientId: auth.aiClientId,
    aiAccountId: auth.aiAccountId,
    action: "account_patch",
  });
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const account = await prisma.aiAccount.findUnique({
    where: { id: normalizedAccountId },
    select: {
      id: true,
      name: true,
      deletedAt: true,
    },
  });
  if (!account || account.deletedAt) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (account.name === validName.name) {
    return Response.json({
      ok: true,
      accountId: account.id,
      name: account.name,
      alreadyCurrent: true,
    });
  }

  const updated = await prisma.aiAccount.update({
    where: { id: account.id },
    data: { name: validName.name },
    select: {
      id: true,
      name: true,
      updatedAt: true,
    },
  });

  return Response.json({
    ok: true,
    accountId: updated.id,
    previousName: account.name,
    name: updated.name,
    renamedAt: updated.updatedAt.toISOString(),
  });
}

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
