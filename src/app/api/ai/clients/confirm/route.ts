import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";
import { requireAiV1Available } from "@/lib/aiVersion";

function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function normalizePairCode(s: string) {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function safeEq(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const clientId = String(body.clientId ?? "").trim();
  const pairCodeRaw = String(body.pairCode ?? "").trim();
  const pairCode = normalizePairCode(pairCodeRaw);

  if (!clientId || !pairCode) {
    return Response.json({ error: "clientId and pairCode are required" }, { status: 400 });
  }
  if (pairCode.length !== 8) {
    return Response.json({ error: "pairCode format invalid" }, { status: 400 });
  }

  const client = await prisma.aiClient.findUnique({
    where: { clientId },
    select: {
      id: true,
      ownerUserId: true,
      status: true,
      revokedAt: true,
      pairCodeHash: true,
      pairCodeExpiresAt: true,
    },
  });

  if (!client || client.ownerUserId !== gate.userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (client.revokedAt) {
    return Response.json({ error: "AI client is revoked" }, { status: 403 });
  }

  if (client.status === "ACTIVE") {
    return Response.json({ ok: true, status: "ACTIVE", alreadyActive: true });
  }

  if (!client.pairCodeHash || !client.pairCodeExpiresAt) {
    return Response.json(
      { error: "AI client has no pending owner confirmation code" },
      { status: 400 },
    );
  }

  if (client.pairCodeExpiresAt <= new Date()) {
    return Response.json({ error: "Pair code expired. Re-register this AI client." }, { status: 400 });
  }

  const gotHash = sha256Hex(pairCode);
  if (!safeEq(gotHash, client.pairCodeHash)) {
    return Response.json({ error: "Pair code mismatch" }, { status: 400 });
  }

  const now = new Date();
  const updated = await prisma.aiClient.update({
    where: { id: client.id },
    data: {
      status: "ACTIVE",
      ownerConfirmedAt: now,
      pairCodeHash: null,
      pairCodeExpiresAt: null,
    },
    select: {
      clientId: true,
      status: true,
      ownerConfirmedAt: true,
    },
  });

  return Response.json({
    ok: true,
    clientId: updated.clientId,
    status: updated.status,
    ownerConfirmedAt: updated.ownerConfirmedAt?.toISOString(),
  });
}
