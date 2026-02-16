import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";

export async function POST(req: Request) {
  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");

  if (!newPassword || newPassword.length < 8) {
    return Response.json({ error: "password must be at least 8 chars" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: gate.userId },
    select: { passwordHash: true },
  });

  // OAuth-only account: allow setting an initial password (no current password required)
  if (!user?.passwordHash) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: gate.userId },
      data: { passwordHash },
    });
    return Response.json({ ok: true, mode: "set" });
  }

  // Credentials account: require current password
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    return Response.json({ error: "Current password incorrect" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: gate.userId },
    data: { passwordHash },
  });

  return Response.json({ ok: true, mode: "change" });
}
