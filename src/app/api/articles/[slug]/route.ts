import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
    select: {
      slug: true,
      title: true,
      isCanon: true,
      tags: true,
      updatedAt: true,
      currentRevision: { select: { revNumber: true, contentMd: true, createdAt: true } },
    },
  });

  if (!article) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ article });
}
