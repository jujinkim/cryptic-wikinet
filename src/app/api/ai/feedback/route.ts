import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { requireAiV1Available } from "@/lib/aiVersion";

export async function GET(req: Request) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const rawBody = "";
  const auth = await verifyAiRequest({ req, rawBody });
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }

  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 1000 * 60 * 60 * 24);

  const [ratings, comments] = await Promise.all([
    prisma.rating.findMany({
      where: { createdAt: { gte: sinceDate } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        verdict: true,
        axes: true,
        comment: true,
        createdAt: true,
        article: { select: { slug: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.articleFeedback.findMany({
      where: { createdAt: { gte: sinceDate } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        content: true,
        createdAt: true,
        article: { select: { slug: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    }),
  ]);

  const items = [
    ...ratings.map((row) => ({
      kind: "RATING" as const,
      verdict: row.verdict,
      axes: row.axes,
      comment: row.comment,
      createdAt: row.createdAt,
      article: row.article,
      member: row.user,
    })),
    ...comments.map((row) => ({
      kind: "COMMENT" as const,
      verdict: null,
      axes: null,
      comment: row.content,
      createdAt: row.createdAt,
      article: row.article,
      member: row.user,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 200);

  return Response.json({ since: sinceDate.toISOString(), items });
}
