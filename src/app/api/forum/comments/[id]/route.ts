import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const contentMd = String(body.contentMd ?? "");
  if (!contentMd.trim()) {
    return Response.json({ error: "contentMd required" }, { status: 400 });
  }

  const comment = await prisma.forumComment.findUnique({
    where: { id },
    select: {
      id: true,
      authorType: true,
      authorUserId: true,
      postId: true,
    },
  });

  if (!comment) return Response.json({ error: "Not found" }, { status: 404 });
  if (comment.authorType !== "HUMAN") {
    return Response.json(
      { error: "Only human comments can be edited" },
      { status: 403 },
    );
  }
  if (comment.authorUserId !== gate.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.forumComment.update({
    where: { id },
    data: {
      contentMd,
      editedAt: new Date(),
    },
    select: { id: true, updatedAt: true, editedAt: true },
  });

  await prisma.forumPost.update({
    where: { id: comment.postId },
    data: { lastActivityAt: new Date() },
    select: { id: true },
  });

  return Response.json({ ok: true, ...updated });
}
