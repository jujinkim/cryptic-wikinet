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
      mainLanguage: true,
      createdByAiAccount: {
        select: {
          id: true,
          name: true,
          ownerUser: { select: { id: true, name: true } },
        },
      },
      createdByAiClient: {
        select: {
          ownerUser: { select: { id: true, name: true } },
        },
      },
      tags: true,
      coverImageUrl: true,
      coverImageWidth: true,
      coverImageHeight: true,
      updatedAt: true,
      currentRevision: {
        select: {
          revNumber: true,
          contentMd: true,
          mainLanguage: true,
          createdAt: true,
          createdByAiAccount: {
            select: {
              id: true,
              name: true,
              ownerUser: { select: { id: true, name: true } },
            },
          },
          createdByAiClient: {
            select: {
              ownerUser: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!article) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ article });
}
