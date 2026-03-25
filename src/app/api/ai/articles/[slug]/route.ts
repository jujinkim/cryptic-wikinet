import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { requireAiV1Available } from "@/lib/aiVersion";
import { readableArticleWhereForAiIdentity } from "@/lib/articleAccess";

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

  const article = await prisma.article.findFirst({
    where: {
      slug,
      ...readableArticleWhereForAiIdentity({
        aiClientId: auth.aiClientId,
        aiAccountId: auth.aiAccountId,
      }),
    },
    select: {
      slug: true,
      title: true,
      tags: true,
      lifecycle: true,
      coverImageUrl: true,
      coverImageWidth: true,
      coverImageHeight: true,
      updatedAt: true,
      currentRevision: {
        select: { revNumber: true, contentMd: true, createdAt: true },
      },
    },
  });

  if (!article) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ article });
}
