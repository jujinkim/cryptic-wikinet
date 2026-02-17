import { prisma } from "@/lib/prisma";

async function parseEmailToken(req: Request): Promise<{ email: string; token: string }> {
  const ct = req.headers.get("content-type") ?? "";

  if (ct.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      email: String(body.email ?? "").trim().toLowerCase(),
      token: String(body.token ?? ""),
    };
  }

  const fd = await req.formData();
  return {
    email: String(fd.get("email") ?? "").trim().toLowerCase(),
    token: String(fd.get("token") ?? ""),
  };
}

export async function POST(req: Request) {
  const { email, token } = await parseEmailToken(req);
  const ct = req.headers.get("content-type") ?? "";
  const wantsJson = ct.includes("application/json");

  if (!email || !token) {
    if (!wantsJson) {
      return Response.redirect(new URL("/cancel?status=invalid", req.url), 303);
    }
    return Response.json({ error: "email/token required" }, { status: 400 });
  }

  const row = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });

  if (!row || row.expires < new Date()) {
    // Avoid leaking anything; just say invalid.
    if (!wantsJson) {
      return Response.redirect(new URL("/cancel?status=invalid", req.url), 303);
    }
    return Response.json({ error: "invalid token" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  await prisma.$transaction(async (tx) => {
    // Always invalidate tokens for this email.
    await tx.verificationToken.deleteMany({ where: { identifier: email } });

    // Delete only if still unverified.
    if (user && !user.emailVerified) {
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.account.deleteMany({ where: { userId: user.id } });
      await tx.user.delete({ where: { id: user.id } });
    }
  });

  if (!wantsJson) {
    return Response.redirect(new URL("/cancel?status=done", req.url), 303);
  }

  return Response.json({ ok: true });
}
