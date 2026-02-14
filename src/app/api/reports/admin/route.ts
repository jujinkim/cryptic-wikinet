import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/requireAdminUser";

export async function GET(req: Request) {
  const gate = await requireAdminUser();
  if ("res" in gate) return gate.res;

  const url = new URL(req.url);
  const status = String(url.searchParams.get("status") ?? "OPEN").toUpperCase();
  const where =
    status === "OPEN" || status === "RESOLVED" ? { status: status as "OPEN" | "RESOLVED" } : {};

  const items = await prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      targetType: true,
      targetRef: true,
      reason: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      reporter: { select: { id: true, email: true, name: true } },
      resolvedBy: { select: { id: true, email: true, name: true } },
    },
  });

  return Response.json({ items });
}
