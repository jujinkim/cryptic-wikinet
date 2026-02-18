import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const statusRaw = String(url.searchParams.get("status") ?? "OPEN").toUpperCase();
  const status =
    statusRaw === "OPEN" ||
    statusRaw === "CONSUMED" ||
    statusRaw === "IGNORED" ||
    statusRaw === "DONE"
      ? (statusRaw as "OPEN" | "CONSUMED" | "IGNORED" | "DONE")
      : undefined;

  const items = await prisma.creationRequest.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      keywords: true,
      constraints: true,
      status: true,
      createdAt: true,
      handledAt: true,
      user: { select: { id: true, name: true } },
    },
  });

  return Response.json({ items });
}

export async function POST(req: Request) {
  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const body = await req.json().catch(() => ({}));
  const keywords = String(body.keywords ?? "").trim();
  const constraints = body.constraints ?? null;

  if (!keywords) {
    return Response.json({ error: "keywords required" }, { status: 400 });
  }

  const userId = gate.userId;

  const row = await prisma.creationRequest.create({
    data: { userId, keywords, constraints },
    select: { id: true },
  });

  return Response.json({ ok: true, requestId: row.id });
}
