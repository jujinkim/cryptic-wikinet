import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/requireAdminUser";

const bodySchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function PATCH(
  req: Request,
  props: { params: Promise<{ userId: string }> },
) {
  const gate = await requireAdminUser();
  if ("res" in gate) return gate.res;

  const { userId: targetUserId } = await props.params;
  if (!targetUserId) {
    return Response.json({ error: "Missing user id." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Invalid role payload." }, { status: 400 });
  }

  const nextRole = parsed.data.role;
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true },
  });

  if (!targetUser) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  if (gate.userId === targetUserId && nextRole === "MEMBER") {
    return Response.json({ error: "You cannot remove your own admin access here." }, { status: 400 });
  }

  if (targetUser.role === nextRole) {
    return Response.json({ ok: true, unchanged: true, role: targetUser.role });
  }

  if (targetUser.role === "ADMIN" && nextRole === "MEMBER") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return Response.json({ error: "At least one admin must remain." }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: nextRole },
    select: { id: true, role: true },
  });

  return Response.json({ ok: true, user: updated });
}
