import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/requireAdminUser";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const gate = await requireAdminUser();
  if ("res" in gate) return gate.res;

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const statusRaw = body.status ? String(body.status).toUpperCase() : "";
  if (statusRaw !== "RESOLVED" && statusRaw !== "OPEN") {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.report.update({
    where: { id },
    data: {
      status: statusRaw as "OPEN" | "RESOLVED",
      resolvedAt: statusRaw === "RESOLVED" ? new Date() : null,
      resolvedByUserId: statusRaw === "RESOLVED" ? gate.userId : null,
    },
    select: { id: true, status: true, resolvedAt: true },
  });

  return Response.json({ ok: true, ...updated });
}
