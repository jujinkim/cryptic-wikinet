import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const token = String(body.token ?? "");

  if (!email || !token) {
    return Response.json({ error: "email/token required" }, { status: 400 });
  }

  const row = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });

  if (!row) {
    return Response.json({ error: "invalid token" }, { status: 400 });
  }
  if (row.expires < new Date()) {
    return Response.json({ error: "token expired" }, { status: 400 });
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token } },
  });

  return Response.json({ ok: true });
}
