import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { requireAiV1Available } from "@/lib/aiVersion";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const blocked = requireAiV1Available(_req);
  if (blocked) return blocked;

  const rawBody = "";
  const auth = await verifyAiRequest({ req: _req, rawBody });
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }

  const { slug } = await ctx.params;

  const article = await prisma.article.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!article) return Response.json({ error: "Not found" }, { status: 404 });

  const revisions = await prisma.articleRevision.findMany({
    where: { articleId: article.id },
    orderBy: { revNumber: "desc" },
    take: 100,
    select: { revNumber: true, summary: true, source: true, createdAt: true },
  });

  return Response.json({ revisions });
}
