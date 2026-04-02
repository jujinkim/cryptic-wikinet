import { publicArticleWhere } from "@/lib/articleAccess";
import { ARTICLE_FEEDBACK_PAGE_SIZE, getArticleFeedbackPage } from "@/lib/articleFeedback";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";

async function getPublicArticleId(slug: string) {
  const article = await prisma.article.findFirst({
    where: { slug, ...publicArticleWhere() },
    select: { id: true },
  });
  return article?.id ?? null;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const articleId = await getPublicArticleId(slug);
  if (!articleId) return Response.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? String(ARTICLE_FEEDBACK_PAGE_SIZE));

  const result = await getArticleFeedbackPage(articleId, page, pageSize);
  return Response.json({ ok: true, ...result });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const articleId = await getPublicArticleId(slug);
  if (!articleId) return Response.json({ error: "Not found" }, { status: 404 });

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;
  const content = String(body.content ?? "").trim();

  if (!content) {
    return Response.json({ error: "Comment is required" }, { status: 400 });
  }

  if (content.length > 2000) {
    return Response.json({ error: "Comment is too long" }, { status: 400 });
  }

  const feedback = await prisma.articleFeedback.create({
    data: {
      articleId,
      userId: gate.userId,
      content,
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return Response.json({ ok: true, item: feedback });
}
