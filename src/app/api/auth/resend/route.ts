import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import crypto from "crypto";
import { consumeAuthRateLimit, getRequestIp } from "@/lib/authRateLimit";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) return Response.json({ error: "email required" }, { status: 400 });

  const ip = getRequestIp(req);
  const rl = await consumeAuthRateLimit({
    action: "resend",
    ip,
    email,
    ipWindowSec: Number(process.env.RL_AUTH_RESEND_IP_WINDOW_SEC ?? 3600),
    ipMax: Number(process.env.RL_AUTH_RESEND_IP_MAX ?? 20),
    emailWindowSec: Number(process.env.RL_AUTH_RESEND_EMAIL_WINDOW_SEC ?? 3600),
    emailMax: Number(process.env.RL_AUTH_RESEND_EMAIL_MAX ?? 5),
  });
  if (!rl.ok) {
    return Response.json(
      { ok: true },
      { status: 200, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  // Avoid user enumeration.
  if (!user) return Response.json({ ok: true });
  if (user.emailVerified) return Response.json({ ok: true });

  // Delete previous tokens for this email (best-effort) to reduce confusion.
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  const origin = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
  const verifyUrl = `${origin}/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  const cancelUrl = `${origin}/cancel?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  const delivery = await sendMail({
    to: email,
    subject: "Verify your email for Cryptic WikiNet",
    text:
      `Verify your email for Cryptic WikiNet:\n\n${verifyUrl}\n\n` +
      `Not you? Cancel signup:\n\n${cancelUrl}\n\n` +
      `This link expires in 30 minutes.`,
  });

  const isDev = process.env.NODE_ENV !== "production";

  return Response.json({
    ok: true,
    deliveryMode: delivery.mode,
    devVerifyUrl:
      isDev && delivery.mode === "console" ? verifyUrl : undefined,
  });
}
