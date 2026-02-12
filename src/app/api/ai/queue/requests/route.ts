import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";

export async function GET(req: Request) {
  const rawBody = "";
  const auth = await verifyAiRequest({ req, rawBody });
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "10"), 50);

  // We select + update in a transaction to reduce races.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = await prisma.$transaction(async (tx: any) => {
    const rows = await tx.creationRequest.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: { id: true, keywords: true, constraints: true, createdAt: true },
    });

    if (rows.length) {
      await tx.creationRequest.updateMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: { id: { in: rows.map((r: any) => r.id) } },
        data: { status: "CONSUMED", handledAt: new Date() },
      });
    }

    return rows;
  });

  return Response.json({ items });
}
