import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const DEFAULT_POW_DIFFICULTY = 20; // leading zero bits
export const DEFAULT_POW_TTL_MS = 2 * 60 * 1000; // 2 minutes

export function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function leadingZeroBitsFromHex(hex: string) {
  let bits = 0;
  for (let i = 0; i < hex.length; i++) {
    const nibble = parseInt(hex[i]!, 16);
    if (nibble === 0) {
      bits += 4;
      continue;
    }
    // count leading zeros in nibble
    if (nibble < 8) bits += 1;
    if (nibble < 4) bits += 1;
    if (nibble < 2) bits += 1;
    break;
  }
  return bits;
}

export function getPowParams(action: string) {
  // Action-specific difficulties to keep forum conversation usable.
  // These are prototype defaults and can be tuned later.
  switch (action) {
    case "register":
      return { difficulty: 22, ttlMs: DEFAULT_POW_TTL_MS };
    case "catalog_write":
      return { difficulty: 20, ttlMs: DEFAULT_POW_TTL_MS };
    case "forum_post":
    case "forum_patch":
      return { difficulty: 19, ttlMs: DEFAULT_POW_TTL_MS };
    case "forum_comment":
      return { difficulty: 17, ttlMs: DEFAULT_POW_TTL_MS };
    default:
      return { difficulty: DEFAULT_POW_DIFFICULTY, ttlMs: DEFAULT_POW_TTL_MS };
  }
}

export async function createPowChallenge(action: string) {
  const challenge = crypto.randomBytes(16).toString("base64url");
  const p = getPowParams(action);
  const expiresAt = new Date(Date.now() + p.ttlMs);

  const row = await prisma.powChallenge.create({
    data: { challenge, action, difficulty: p.difficulty, expiresAt },
    select: { id: true, challenge: true, difficulty: true, expiresAt: true, action: true },
  });

  return row;
}

export async function verifyAndConsumePow(args: {
  powId: string;
  nonce: string;
  expectedAction?: string;
}) {
  const { powId, nonce, expectedAction } = args;

  const row = await prisma.powChallenge.findUnique({
    where: { id: powId },
    select: {
      id: true,
      challenge: true,
      action: true,
      difficulty: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (!row) {
    return { ok: false as const, message: "Invalid pow challenge" };
  }
  if (expectedAction && row.action !== expectedAction) {
    return { ok: false as const, message: "PoW action mismatch" };
  }
  if (row.usedAt) {
    return { ok: false as const, message: "PoW challenge already used" };
  }
  if (row.expiresAt < new Date()) {
    return { ok: false as const, message: "PoW challenge expired" };
  }

  const hashHex = sha256Hex(`${row.challenge}:${nonce}`);
  const lz = leadingZeroBitsFromHex(hashHex);
  if (lz < row.difficulty) {
    return { ok: false as const, message: "PoW invalid" };
  }

  // consume
  await prisma.powChallenge.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });

  return { ok: true as const, difficulty: row.difficulty, hashHex };
}
