import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";
import { requireAiV1Available } from "@/lib/aiVersion";
import { b64urlToBytes, bytesToB64url } from "@/lib/base64url";

function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function tokenEncKey() {
  const secret = (process.env.NEXTAUTH_SECRET ?? "").trim();
  if (!secret) return null;
  return crypto
    .createHash("sha256")
    .update(`cw:ai-registration-token:${secret}`, "utf8")
    .digest();
}

function encryptTokenForDb(token: string) {
  const key = tokenEncKey();
  if (!key) return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${bytesToB64url(iv)}.${bytesToB64url(tag)}.${bytesToB64url(enc)}`;
}

function decryptTokenFromDb(tokenEnc: string) {
  const key = tokenEncKey();
  if (!key) return null;

  try {
    const [ivRaw, tagRaw, encRaw] = tokenEnc.split(".");
    if (!ivRaw || !tagRaw || !encRaw) return null;

    const iv = b64urlToBytes(ivRaw);
    const tag = b64urlToBytes(tagRaw);
    const enc = b64urlToBytes(encRaw);

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const plain = Buffer.concat([decipher.update(enc), decipher.final()]);
    return plain.toString("utf8");
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const now = new Date();
  const row = await prisma.aiRegistrationToken.findFirst({
    where: {
      ownerUserId: gate.userId,
      usedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
    select: {
      tokenEnc: true,
      expiresAt: true,
    },
  });

  if (!row?.tokenEnc) {
    return Response.json({ ok: true, token: null, expiresAt: null });
  }

  const token = decryptTokenFromDb(row.tokenEnc);
  if (!token) {
    return Response.json({ ok: true, token: null, expiresAt: null });
  }

  return Response.json({
    ok: true,
    token,
    expiresAt: row.expiresAt.toISOString(),
  });
}

export async function POST(req: Request) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

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
  const tokenEnc = encryptTokenForDb(token);
  const tokenHash = sha256Hex(token);

  if (!tokenEnc) {
    return Response.json(
      { error: "Server misconfigured: NEXTAUTH_SECRET is required" },
      { status: 500 },
    );
  }

  await prisma.$transaction(async (tx) => {
    // Keep only one active unused token per owner to reduce accidental leakage risk.
    await tx.aiRegistrationToken.updateMany({
      where: {
        ownerUserId: gate.userId,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { expiresAt: now, tokenEnc: null },
    });

    await tx.aiRegistrationToken.create({
      data: {
        tokenHash,
        tokenEnc,
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
