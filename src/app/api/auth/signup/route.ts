import { prisma } from "@/lib/prisma";
import { isBlockedEmail } from "@/lib/emailPolicy";
import { sendMail } from "@/lib/mailer";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return Response.json({ error: "email/password required" }, { status: 400 });
  }
  if (isBlockedEmail(email)) {
    return Response.json({ error: "email domain not allowed" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "password must be at least 8 chars" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return Response.json({ error: "email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true },
  });

  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  const url = new URL(req.url);
  const verifyUrl = `${url.origin}/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  const cancelUrl = `${url.origin}/cancel?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  const delivery = await sendMail({
    to: email,
    subject: "Verify your email for Cryptic WikiNet",
    text:
      `Verify your email for Cryptic WikiNet:\n\n${verifyUrl}\n\n` +
      `Not you? Cancel signup:\n\n${cancelUrl}\n\n` +
      `This link expires in 30 minutes.`,
  });

  const isDev = process.env.NODE_ENV !== "production";

  // In dev fallback (no SMTP), optionally return the link to the client for convenience.
  // Never do this in production.
  return Response.json({
    ok: true,
    userId: user.id,
    deliveryMode: delivery.mode,
    devVerifyUrl:
      isDev && delivery.mode === "console" ? verifyUrl : undefined,
  });
}
