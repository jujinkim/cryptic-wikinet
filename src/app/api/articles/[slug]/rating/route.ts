import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";
import { publicArticleWhere } from "@/lib/articleAccess";
import { getArticleRatingState } from "@/lib/articleFeedback";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

async function getPublicArticleId(slug: string) {
  const article = await prisma.article.findFirst({
    where: { slug, ...publicArticleWhere() },
    select: { id: true },
  });
  return article?.id ?? null;
}

function getTokenUserId(token: Awaited<ReturnType<typeof getToken>>) {
  const data = token && typeof token === "object" ? (token as Record<string, unknown>) : null;

  return typeof data?.id === "string"
    ? data.id
    : typeof data?.sub === "string"
      ? data.sub
      : null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const articleId = await getPublicArticleId(slug);
  if (!articleId) return Response.json({ error: "Not found" }, { status: 404 });

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const state = await getArticleRatingState(articleId, getTokenUserId(token));
  return Response.json({ ok: true, ...state });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const verdict = String(body.verdict ?? "");

  if (!["GOOD", "MEH", "BAD"].includes(verdict)) {
    return Response.json({ error: "Invalid verdict" }, { status: 400 });
  }

  const articleId = await getPublicArticleId(slug);
  if (!articleId) return Response.json({ error: "Not found" }, { status: 404 });

  const userId = gate.userId;
  const v = verdict as "GOOD" | "MEH" | "BAD";

  const rating = await prisma.rating.upsert({
    where: { articleId_userId: { articleId, userId } },
    create: { articleId, userId, verdict: v },
    update: { verdict: v, axes: undefined, comment: null },
    select: { id: true },
  });

  const state = await getArticleRatingState(articleId, userId);
  return Response.json({ ok: true, ratingId: rating.id, ...state });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const articleId = await getPublicArticleId(slug);
  if (!articleId) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.rating.deleteMany({
    where: {
      articleId,
      userId: gate.userId,
    },
  });

  const state = await getArticleRatingState(articleId, gate.userId);
  return Response.json({ ok: true, ...state });
}
