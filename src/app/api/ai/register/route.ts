import crypto from "crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { envInt } from "@/lib/config";
import { requireAiV1Available } from "@/lib/aiVersion";
import { verifyAndConsumePow } from "@/lib/pow";
import { validateAiAccountName } from "@/lib/aiAccountName";
import { aiMaxAccountsPerUser } from "@/lib/policies";

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

function makeAiAccountId() {
  return `acct_${crypto.randomBytes(12).toString("hex")}`;
}

function isSerializableConflict(error: unknown) {
  return (error as { code?: string } | null)?.code === "P2034";
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
  const pairCodeRaw = makePairCodeRaw();
  const pairCodeHash = sha256Hex(pairCodeRaw);
  const pairCodeTtlMin = pairCodeTtlMinutes();
  const pairCodeExpiresAt = new Date(now.getTime() + pairCodeTtlMin * 60 * 1000);
  const maxAiAccounts = aiMaxAccountsPerUser();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const row = await prisma.$transaction(
        async (tx) => {
          const regToken = await tx.aiRegistrationToken.findUnique({
            where: { tokenHash },
            select: {
              id: true,
              ownerUserId: true,
              aiAccountId: true,
              usedAt: true,
              expiresAt: true,
              aiAccount: {
                select: {
                  id: true,
                  name: true,
                  ownerUserId: true,
                  deletedAt: true,
                },
              },
            },
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

          let aiAccountId = regToken.aiAccountId ?? null;
          let aiAccountName = regToken.aiAccount?.name ?? null;

          if (aiAccountId) {
            if (!regToken.aiAccount || regToken.aiAccount.ownerUserId !== regToken.ownerUserId) {
              throw new RegisterError("Registration token account mismatch", 409);
            }
            if (regToken.aiAccount.deletedAt) {
              throw new RegisterError("AI account was deleted", 410);
            }
          }

          const consumed = await tx.aiRegistrationToken.updateMany({
            where: {
              id: regToken.id,
              usedAt: null,
              expiresAt: { gt: now },
            },
            data: { usedAt: now, tokenEnc: null },
          });
          if (consumed.count !== 1) {
            throw new RegisterError("Registration token already used", 403);
          }

          if (!aiAccountId) {
            const ownedCount = await tx.aiAccount.count({
              where: { ownerUserId: regToken.ownerUserId, deletedAt: null },
            });
            if (ownedCount >= maxAiAccounts) {
              throw new RegisterError(
                `AI account limit reached (max ${maxAiAccounts} per user)`,
                409,
              );
            }

            const validName = validateAiAccountName(name);
            if (!validName.ok) {
              throw new RegisterError(
                validName.message === "name is required"
                  ? "name is required for new AI account registration"
                  : validName.message,
                400,
              );
            }

            const account = await tx.aiAccount.create({
              data: {
                id: makeAiAccountId(),
                name: validName.name,
                ownerUserId: regToken.ownerUserId,
              },
              select: {
                id: true,
                name: true,
              },
            });
            aiAccountId = account.id;
            aiAccountName = account.name;
          }

          return tx.aiClient.create({
            data: {
              name: aiAccountName ?? name,
              clientId,
              publicKey,
              aiAccountId,
              ownerUserId: regToken.ownerUserId,
              status: "PENDING",
              pairCodeHash,
              pairCodeExpiresAt,
            },
            select: {
              id: true,
              aiAccountId: true,
              clientId: true,
              name: true,
              status: true,
              rateLimitWindowSec: true,
              rateLimitMaxWrites: true,
              createdAt: true,
              ownerUserId: true,
              pairCodeExpiresAt: true,
              aiAccount: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return Response.json({
        ok: true,
        aiAccountId: row.aiAccountId,
        aiAccountName: row.aiAccount?.name ?? row.name,
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

      if (attempt < 1 && isSerializableConflict(e)) {
        continue;
      }

      const code = (e as { code?: string } | null)?.code;
      if (code === "P2002") {
        return Response.json({ error: "publicKey already registered" }, { status: 409 });
      }

      throw e;
    }
  }

  return Response.json({ error: "Registration failed" }, { status: 500 });
}
