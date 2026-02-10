import crypto from "crypto";
import nacl from "tweetnacl";
import { prisma } from "@/lib/prisma";
import { b64urlToBytes } from "@/lib/base64url";
import { maybeCleanup } from "@/lib/cleanup";

function sha256Base16(input: string | Buffer) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export type AiAuthResult =
  | { ok: true; aiClientId: string }
  | { ok: false; status: number; message: string };

/**
 * HMAC scheme:
 * Headers:
 *  - X-AI-Client-Id
 *  - X-AI-Timestamp (unix ms)
 *  - X-AI-Nonce
 *  - X-AI-Signature (base64)
 * Canonical:
 *  METHOD\nPATH\nTIMESTAMP\nNONCE\nSHA256(body)\n
 */
export async function verifyAiRequest(args: {
  req: Request;
  rawBody: string;
}): Promise<AiAuthResult> {
  const { req, rawBody } = args;

  const clientId = req.headers.get("x-ai-client-id") ?? "";
  const tsRaw = req.headers.get("x-ai-timestamp") ?? "";
  const nonce = req.headers.get("x-ai-nonce") ?? "";
  const sigB64 = req.headers.get("x-ai-signature") ?? "";

  if (!clientId || !tsRaw || !nonce || !sigB64) {
    return { ok: false, status: 401, message: "Missing AI auth headers" };
  }

  const ts = Number(tsRaw);
  if (!Number.isFinite(ts)) {
    return { ok: false, status: 401, message: "Invalid timestamp" };
  }

  const now = Date.now();
  const skewMs = Math.abs(now - ts);
  if (skewMs > 60_000) {
    return { ok: false, status: 401, message: "Timestamp out of range" };
  }

  const aiClient = await prisma.aiClient.findUnique({
    where: { clientId },
    select: { id: true, revokedAt: true, publicKey: true },
  });

  if (!aiClient || aiClient.revokedAt) {
    return { ok: false, status: 401, message: "Unknown or revoked AI client" };
  }

  // Nonce replay protection (DB-backed). For prototype this is fine.
  // Later: move to Redis with TTL for better performance.
  try {
    await prisma.aiNonce.create({
      data: { aiClientId: aiClient.id, nonce },
    });
  } catch {
    return { ok: false, status: 401, message: "Replay detected (nonce reused)" };
  }

  // opportunistic cleanup
  await maybeCleanup();

  const url = new URL(req.url);
  const method = req.method.toUpperCase();
  const path = url.pathname;
  const bodyHash = sha256Base16(rawBody);

  const canonical = `${method}\n${path}\n${tsRaw}\n${nonce}\n${bodyHash}\n`;

  let sigBytes: Buffer;
  let pkBytes: Buffer;
  try {
    sigBytes = b64urlToBytes(sigB64);
    pkBytes = b64urlToBytes(aiClient.publicKey);
  } catch {
    return { ok: false, status: 401, message: "Bad signature/publicKey encoding" };
  }

  const ok = nacl.sign.detached.verify(
    Buffer.from(canonical, "utf8"),
    sigBytes,
    pkBytes,
  );

  if (!ok) {
    return { ok: false, status: 401, message: "Bad signature" };
  }

  return { ok: true, aiClientId: aiClient.id };
}
