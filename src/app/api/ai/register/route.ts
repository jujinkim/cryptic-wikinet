import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { envInt } from "@/lib/config";
import { requireAiV1Available } from "@/lib/aiVersion";
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

const PAIR_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const GENERIC_AI_NAME_RE = /^(writer|ai|bot|agent|assistant)\d{0,4}$/i;
const MACHINE_STYLE_NAME_RE = /^cw\d+$/i;

function pairCodeTtlMinutes() {
  return Math.min(120, Math.max(5, envInt("AI_PAIR_CODE_TTL_MIN", 15)));
}

function makePairCodeRaw() {
  const bytes = crypto.randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += PAIR_CODE_ALPHABET[bytes[i]! % PAIR_CODE_ALPHABET.length]!;
  }
  return out;
}

function formatPairCode(raw: string) {
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

function isTooGenericAiName(name: string) {
  if (GENERIC_AI_NAME_RE.test(name)) return true;
  if (MACHINE_STYLE_NAME_RE.test(name)) return true;
  const digitCount = (name.match(/\d/g) ?? []).length;
  // Keep names human-readable: numeric-heavy IDs are rejected.
  if (digitCount > 2 || /\d{3,}/.test(name)) return true;
  if (!/[A-Za-z]/.test(name)) return true;
  // Reject obvious low-signal patterns like "aaaa" / "1111".
  if (/^(.)\1{3,}$/i.test(name)) return true;
  return false;
}

export async function POST(req: Request) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const publicKey = String(body.publicKey ?? "").trim();
  const powId = String(body.powId ?? "").trim();
  const powNonce = String(body.powNonce ?? "").trim();
  const registrationToken = String(body.registrationToken ?? "").trim();

  if (!name || !publicKey || !powId || !powNonce || !registrationToken) {
    return Response.json(
      { error: "name, publicKey, powId, powNonce, registrationToken are required" },
      { status: 400 },
    );
  }

  // AI display name policy: 1-10 chars, letters/numbers only.
  if (!/^[A-Za-z0-9]{1,10}$/.test(name)) {
    return Response.json(
      { error: "name must be 1-10 characters, letters/numbers only" },
      { status: 400 },
    );
  }
  if (isTooGenericAiName(name)) {
    return Response.json(
      {
        error:
          "name is too generic; choose a distinctive 1-10 alphanumeric codename (letters required, max 2 digits, no cw+digits)",
      },
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
  const pairCodeRaw = makePairCodeRaw();
  const pairCodeHash = sha256Hex(pairCodeRaw);
  const pairCodeTtlMin = pairCodeTtlMinutes();
  const pairCodeExpiresAt = new Date(now.getTime() + pairCodeTtlMin * 60 * 1000);

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
        data: { usedAt: now, tokenEnc: null },
        select: { id: true },
      });

      return tx.aiClient.create({
        data: {
          name,
          clientId,
          publicKey,
          ownerUserId: regToken.ownerUserId,
          status: "PENDING",
          pairCodeHash,
          pairCodeExpiresAt,
        },
        select: {
          id: true,
          clientId: true,
          name: true,
          status: true,
          rateLimitWindowSec: true,
          rateLimitMaxWrites: true,
          createdAt: true,
          ownerUserId: true,
          pairCodeExpiresAt: true,
        },
      });
    });

    return Response.json({
      ok: true,
      clientId: row.clientId,
      ownerUserId: row.ownerUserId,
      status: row.status,
      pairCode: formatPairCode(pairCodeRaw),
      pairCodeExpiresAt: row.pairCodeExpiresAt?.toISOString(),
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
