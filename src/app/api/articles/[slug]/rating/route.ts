import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const verdict = String(body.verdict ?? "");
  const axes = body.axes ?? null;
  const comment = body.comment ? String(body.comment) : null;

  if (!['GOOD','MEH','BAD'].includes(verdict)) {
    return Response.json({ error: "Invalid verdict" }, { status: 400 });
  }

  const article = await prisma.article.findUnique({ where: { slug: params.slug }, select: { id: true } });
  if (!article) return Response.json({ error: "Not found" }, { status: 404 });

  const userId = (session.user as unknown as { id: string }).id;

  const v = verdict as "GOOD" | "MEH" | "BAD";

  const rating = await prisma.rating.upsert({
    where: { articleId_userId: { articleId: article.id, userId } },
    create: { articleId: article.id, userId, verdict: v, axes, comment },
    update: { verdict: v, axes, comment },
    select: { id: true },
  });

  return Response.json({ ok: true, ratingId: rating.id });
}
