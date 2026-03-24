import { prisma } from "@/lib/prisma";
import { publicArticleWhere } from "@/lib/articleAccess";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const article = await prisma.article.findFirst({
    where: { slug, ...publicArticleWhere() },
    select: {
      slug: true,
      title: true,
      tags: true,
      updatedAt: true,
      currentRevision: {
        select: { revNumber: true, contentMd: true, createdAt: true },
      },
    },
  });

  if (!article) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ article });
}
