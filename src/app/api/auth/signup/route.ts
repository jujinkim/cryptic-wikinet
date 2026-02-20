import { prisma } from "@/lib/prisma";
import { isBlockedEmail } from "@/lib/emailPolicy";
import { sendMail } from "@/lib/mailer";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { consumeAuthRateLimit, getRequestIp } from "@/lib/authRateLimit";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const ip = getRequestIp(req);
  const rl = await consumeAuthRateLimit({
    action: "signup",
    ip,
    email,
    ipWindowSec: Number(process.env.RL_AUTH_SIGNUP_IP_WINDOW_SEC ?? 3600),
    ipMax: Number(process.env.RL_AUTH_SIGNUP_IP_MAX ?? 10),
    emailWindowSec: Number(process.env.RL_AUTH_SIGNUP_EMAIL_WINDOW_SEC ?? 3600),
    emailMax: Number(process.env.RL_AUTH_SIGNUP_EMAIL_MAX ?? 3),
  });
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

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
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true },
      });

      await tx.verificationToken.create({
        data: { identifier: email, token, expires },
      });

      return created;
    });

    const origin = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
    const verifyUrl = `${origin}/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const cancelUrl = `${origin}/cancel?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    const isDev = process.env.NODE_ENV !== "production";
    let deliveryMode: "smtp" | "console" | "failed" = "failed";
    let devVerifyUrl: string | undefined;

    try {
      const delivery = await sendMail({
        to: email,
        subject: "Verify your email for Cryptic WikiNet",
        text:
          `Verify your email for Cryptic WikiNet:\n\n${verifyUrl}\n\n` +
          `Not you? Cancel signup:\n\n${cancelUrl}\n\n` +
          `This link expires in 30 minutes.`,
      });
      deliveryMode = delivery.mode;
      if (isDev && delivery.mode === "console") {
        devVerifyUrl = verifyUrl;
      }
    } catch {
      // Keep account created; user can resend verification from profile settings.
      deliveryMode = "failed";
    }

    // In dev fallback (no SMTP), optionally return the link to the client for convenience.
    // Never do this in production.
    return Response.json({
      ok: true,
      userId: user.id,
      deliveryMode,
      devVerifyUrl,
    });
  } catch (e) {
    const code = (e as { code?: string } | null)?.code;
    if (code === "P2002") {
      return Response.json({ error: "email already registered" }, { status: 409 });
    }

    return Response.json({ error: "Signup failed" }, { status: 500 });
  }
}
