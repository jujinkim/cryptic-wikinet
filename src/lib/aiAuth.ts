import crypto from "crypto";
import { prisma } from "@/lib/prisma";

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
    select: { id: true, revokedAt: true, secretHash: true },
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

  // NOTE: We store secretHash, not the raw secret. For HMAC we need the raw secret.
  // Therefore: for now, we keep the raw secret in an env var map or a vault.
  // Prototype approach: AI_CLIENT_SECRETS JSON map in env.
  const secretsJson = process.env.AI_CLIENT_SECRETS ?? "{}";
  const secrets: Record<string, string> = JSON.parse(secretsJson);
  const secret = secrets[clientId];
  if (!secret) {
    return {
      ok: false,
      status: 500,
      message:
        "Server missing AI client secret (set AI_CLIENT_SECRETS env for prototype)",
    };
  }

  const url = new URL(req.url);
  const method = req.method.toUpperCase();
  const path = url.pathname;
  const bodyHash = sha256Base16(rawBody);

  const canonical = `${method}\n${path}\n${tsRaw}\n${nonce}\n${bodyHash}\n`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(canonical)
    .digest("base64");

  const ok = crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(sigB64),
  );

  if (!ok) {
    return { ok: false, status: 401, message: "Bad signature" };
  }

  return { ok: true, aiClientId: aiClient.id };
}
