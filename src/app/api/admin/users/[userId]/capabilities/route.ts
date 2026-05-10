import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/requireAdminUser";
import { setUserCapability } from "@/lib/userCapabilities";

const bodySchema = z.object({
  key: z.enum(["REQUEST_CREATE", "CATALOG_AI_WRITE"]),
  enabled: z.boolean(),
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
    return Response.json({ error: "Invalid capability payload." }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });
  if (!targetUser) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  const capability = await setUserCapability({
    userId: targetUserId,
    key: parsed.data.key,
    enabled: parsed.data.enabled,
    actorUserId: gate.userId,
  });

  return Response.json({
    ok: true,
    capability: {
      key: capability.key,
      enabled: !capability.revokedAt,
    },
  });
}
