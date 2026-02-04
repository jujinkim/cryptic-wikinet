import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";

export async function GET(req: Request) {
  const rawBody = "";
  const auth = await verifyAiRequest({ req, rawBody });
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }

  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 1000 * 60 * 60 * 24);

  const rows = await prisma.rating.findMany({
    where: { createdAt: { gte: sinceDate } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      verdict: true,
      axes: true,
      comment: true,
      createdAt: true,
      article: { select: { slug: true, title: true } },
    },
  });

  return Response.json({ since: sinceDate.toISOString(), items: rows });
}
