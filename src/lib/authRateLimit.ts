import { prisma } from "@/lib/prisma";

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

function nowMs() {
  return Date.now();
}

export function getRequestIp(req: Request): string {
  // Vercel / reverse proxy compatible.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip.trim();
  return "unknown";
}

async function maybeCleanup() {
  // Keep it cheap. Best-effort cleanup occasionally.
  if (Math.random() > 0.02) return;
  const cutoff = new Date(nowMs() - 1000 * 60 * 60 * 24 * 14); // 14 days
  await prisma.authRateLimitBucket.deleteMany({
    where: { updatedAt: { lt: cutoff } },
  });
}

export async function consumeBucket(args: {
  key: string;
  windowSec: number;
  max: number;
}): Promise<RateLimitResult> {
  const { key, windowSec, max } = args;
  const now = new Date();
  const windowMs = windowSec * 1000;

  const res = await prisma.$transaction(async (tx) => {
    const row = await tx.authRateLimitBucket.findUnique({
      where: { key },
      select: { key: true, count: true, windowStart: true },
    });

    if (!row) {
      await tx.authRateLimitBucket.create({
        data: { key, count: 1, windowStart: now },
        select: { key: true },
      });
      return { ok: true as const };
    }

    const ageMs = now.getTime() - row.windowStart.getTime();
    if (ageMs > windowMs) {
      await tx.authRateLimitBucket.update({
        where: { key },
        data: { count: 1, windowStart: now },
        select: { key: true },
      });
      return { ok: true as const };
    }

    if (row.count >= max) {
      const retryAfterSec = Math.max(1, Math.ceil((windowMs - ageMs) / 1000));
      return { ok: false as const, retryAfterSec };
    }

    await tx.authRateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
      select: { key: true },
    });

    return { ok: true as const };
  });

  await maybeCleanup();
  return res;
}

export async function consumeAuthRateLimit(args: {
  action: "signup" | "resend" | "login";
  ip: string;
  email?: string | null;
  ipWindowSec: number;
  ipMax: number;
  emailWindowSec: number;
  emailMax: number;
}): Promise<RateLimitResult> {
  const email = args.email ? args.email.toLowerCase().trim() : "";

  const ipKey = `auth:${args.action}:ip:${args.ip}`;
  const r1 = await consumeBucket({ key: ipKey, windowSec: args.ipWindowSec, max: args.ipMax });
  if (!r1.ok) return r1;

  if (email) {
    const emailKey = `auth:${args.action}:email:${email}`;
    const r2 = await consumeBucket({
      key: emailKey,
      windowSec: args.emailWindowSec,
      max: args.emailMax,
    });
    if (!r2.ok) return r2;
  }

  return { ok: true };
}
