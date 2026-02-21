import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";

function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

export async function POST(req: Request) {
  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const ttlRaw = Number(body.ttlMinutes ?? 30);
  const ttlMinutes = Number.isFinite(ttlRaw)
    ? Math.min(180, Math.max(5, Math.trunc(ttlRaw)))
    : 30;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
  const token = crypto.randomBytes(24).toString("base64url");
  const tokenHash = sha256Hex(token);

  await prisma.$transaction(async (tx) => {
    // Keep only one active unused token per owner to reduce accidental leakage risk.
    await tx.aiRegistrationToken.updateMany({
      where: {
        ownerUserId: gate.userId,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { expiresAt: now },
    });

    await tx.aiRegistrationToken.create({
      data: {
        tokenHash,
        ownerUserId: gate.userId,
        expiresAt,
      },
      select: { id: true },
    });
  });

  return Response.json({
    ok: true,
    token,
    expiresAt: expiresAt.toISOString(),
    ttlMinutes,
  });
}
