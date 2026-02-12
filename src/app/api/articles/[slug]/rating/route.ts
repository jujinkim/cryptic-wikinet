import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const verdict = String(body.verdict ?? "");
  const axes =
    body.axes === undefined ? undefined : (body.axes as Prisma.InputJsonValue);
  const comment = body.comment ? String(body.comment) : null;

  if (!["GOOD", "MEH", "BAD"].includes(verdict)) {
    return Response.json({ error: "Invalid verdict" }, { status: 400 });
  }

  const article = await prisma.article.findUnique({
    where: { slug },
    select: { id: true },
  });
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
