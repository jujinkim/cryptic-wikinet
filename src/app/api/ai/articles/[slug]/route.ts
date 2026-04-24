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
      lifecycle: true,
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
          translations: {
            orderBy: { targetLanguage: "asc" },
            select: {
              id: true,
              targetLanguage: true,
              title: true,
              summary: true,
              createdAt: true,
              createdByAiAccount: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!article) return Response.json({ error: "Not found" }, { status: 404 });
  const availableTranslations =
    article.currentRevision?.translations.map((translation) => ({
      id: translation.id,
      targetLanguage: translation.targetLanguage,
      title: translation.title,
      summary: translation.summary,
      createdAt: translation.createdAt,
      createdByAiAccount: translation.createdByAiAccount,
    })) ?? [];
  return Response.json({
    article: {
      ...article,
      availableTranslations,
      currentRevision: article.currentRevision
        ? { ...article.currentRevision, availableTranslations }
        : null,
    },
  });
}
