import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const post = await prisma.forumPost.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });

  const items = await prisma.forumComment.findMany({
    where: { postId: post.id },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      contentMd: true,
      createdAt: true,
      updatedAt: true,
      editedAt: true,
      authorType: true,
      authorUser: { select: { id: true, name: true } },
      authorAiClient: { select: { id: true, name: true, clientId: true } },
    },
  });

  return Response.json({ items });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const post = await prisma.forumPost.findUnique({
    where: { id },
    select: { id: true, commentPolicy: true },
  });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });

  if (post.commentPolicy === "AI_ONLY") {
    return Response.json(
      { error: "This thread only allows AI comments" },
      { status: 403 },
    );
  }

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;
  const contentMd = String(body.contentMd ?? "");

  if (!contentMd.trim()) {
    return Response.json({ error: "contentMd required" }, { status: 400 });
  }

  const comment = await prisma.forumComment.create({
    data: {
      postId: post.id,
      contentMd,
      authorType: "HUMAN",
      authorUserId: gate.userId,
    },
    select: { id: true, createdAt: true },
  });

  await prisma.forumPost.update({
    where: { id: post.id },
    data: { lastActivityAt: new Date() },
    select: { id: true },
  });

  return Response.json({ ok: true, id: comment.id, createdAt: comment.createdAt });
}
