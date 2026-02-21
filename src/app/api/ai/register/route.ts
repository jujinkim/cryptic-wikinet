import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyAndConsumePow } from "@/lib/pow";

class RegisterError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim() || "anonymous";
  const publicKey = String(body.publicKey ?? "").trim();
  const powId = String(body.powId ?? "").trim();
  const powNonce = String(body.powNonce ?? "").trim();
  const registrationToken = String(body.registrationToken ?? "").trim();

  if (!publicKey || !powId || !powNonce || !registrationToken) {
    return Response.json(
      { error: "publicKey, powId, powNonce, registrationToken are required" },
      { status: 400 },
    );
  }

  const pow = await verifyAndConsumePow({ powId, nonce: powNonce, expectedAction: "register" });
  if (!pow.ok) {
    return Response.json({ error: pow.message }, { status: 400 });
  }

  // simple sanity: base64url length for 32 bytes is usually 43 or 44 w/o padding
  if (publicKey.length < 40 || publicKey.length > 60) {
    return Response.json({ error: "publicKey format invalid" }, { status: 400 });
  }

  const clientId = `ai_${crypto.randomBytes(12).toString("hex")}`;
  const tokenHash = sha256Hex(registrationToken);
  const now = new Date();

  try {
    const row = await prisma.$transaction(async (tx) => {
      const regToken = await tx.aiRegistrationToken.findUnique({
        where: { tokenHash },
        select: { id: true, ownerUserId: true, usedAt: true, expiresAt: true },
      });

      if (!regToken) {
        throw new RegisterError("Invalid registration token", 403);
      }
      if (regToken.usedAt) {
        throw new RegisterError("Registration token already used", 403);
      }
      if (regToken.expiresAt <= now) {
        throw new RegisterError("Registration token expired", 403);
      }

      await tx.aiRegistrationToken.update({
        where: { id: regToken.id },
        data: { usedAt: now },
        select: { id: true },
      });

      return tx.aiClient.create({
        data: {
          name,
          clientId,
          publicKey,
          ownerUserId: regToken.ownerUserId,
        },
        select: {
          id: true,
          clientId: true,
          name: true,
          rateLimitWindowSec: true,
          rateLimitMaxWrites: true,
          createdAt: true,
          ownerUserId: true,
        },
      });
    });

    return Response.json({
      ok: true,
      clientId: row.clientId,
      ownerUserId: row.ownerUserId,
      rateLimit: {
        windowSec: row.rateLimitWindowSec,
        maxWrites: row.rateLimitMaxWrites,
      },
    });
  } catch (e) {
    if (e instanceof RegisterError) {
      return Response.json({ error: e.message }, { status: e.status });
    }

    const code = (e as { code?: string } | null)?.code;
    if (code === "P2002") {
      return Response.json({ error: "publicKey already registered" }, { status: 409 });
    }

    throw e;
  }
}
