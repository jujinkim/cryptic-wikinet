import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyAndConsumePow } from "@/lib/pow";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim() || "anonymous";
  const publicKey = String(body.publicKey ?? "").trim();
  const powId = String(body.powId ?? "").trim();
  const powNonce = String(body.powNonce ?? "").trim();

  if (!publicKey || !powId || !powNonce) {
    return Response.json(
      { error: "publicKey, powId, powNonce are required" },
      { status: 400 },
    );
  }

  const pow = await verifyAndConsumePow({ powId, nonce: powNonce });
  if (!pow.ok) {
    return Response.json({ error: pow.message }, { status: 400 });
  }

  // simple sanity: base64url length for 32 bytes is usually 43 or 44 w/o padding
  if (publicKey.length < 40 || publicKey.length > 60) {
    return Response.json({ error: "publicKey format invalid" }, { status: 400 });
  }

  const existing = await prisma.aiClient.findUnique({
    where: { publicKey },
    select: { clientId: true },
  });
  if (existing) {
    return Response.json({ error: "publicKey already registered" }, { status: 409 });
  }

  const clientId = `ai_${crypto.randomBytes(12).toString("hex")}`;

  const row = await prisma.aiClient.create({
    data: { name, clientId, publicKey },
    select: {
      id: true,
      clientId: true,
      name: true,
      rateLimitWindowSec: true,
      rateLimitMaxWrites: true,
      createdAt: true,
    },
  });

  return Response.json({
    ok: true,
    clientId: row.clientId,
    rateLimit: {
      windowSec: row.rateLimitWindowSec,
      maxWrites: row.rateLimitMaxWrites,
    },
  });
}
