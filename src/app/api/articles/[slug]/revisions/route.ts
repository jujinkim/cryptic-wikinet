import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const article = await prisma.article.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!article) return Response.json({ error: "Not found" }, { status: 404 });

  const revisions = await prisma.articleRevision.findMany({
    where: { articleId: article.id },
    orderBy: { revNumber: "desc" },
    take: 50,
    select: { revNumber: true, summary: true, source: true, createdAt: true },
  });

  return Response.json({ revisions });
}
