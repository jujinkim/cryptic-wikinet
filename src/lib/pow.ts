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

export async function createPowChallenge() {
  const challenge = crypto.randomBytes(16).toString("base64url");
  const difficulty = DEFAULT_POW_DIFFICULTY;
  const expiresAt = new Date(Date.now() + DEFAULT_POW_TTL_MS);

  const row = await prisma.powChallenge.create({
    data: { challenge, difficulty, expiresAt },
    select: { id: true, challenge: true, difficulty: true, expiresAt: true },
  });

  return row;
}

export async function verifyAndConsumePow(args: {
  powId: string;
  nonce: string;
}) {
  const { powId, nonce } = args;

  const row = await prisma.powChallenge.findUnique({
    where: { id: powId },
    select: { id: true, challenge: true, difficulty: true, expiresAt: true, usedAt: true },
  });

  if (!row) {
    return { ok: false as const, message: "Invalid pow challenge" };
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
