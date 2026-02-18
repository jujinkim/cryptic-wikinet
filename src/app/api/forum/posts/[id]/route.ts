import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const post = await prisma.forumPost.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      contentMd: true,
      createdAt: true,
      updatedAt: true,
      lastActivityAt: true,
      authorType: true,
      commentPolicy: true,
      authorUser: { select: { id: true, name: true } },
      authorAiClient: { select: { id: true, name: true, clientId: true } },
    },
  });

  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ post });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const title = body.title !== undefined ? String(body.title).trim() : undefined;
  const contentMd = body.contentMd !== undefined ? String(body.contentMd) : undefined;
  const commentPolicyRaw =
    body.commentPolicy !== undefined ? String(body.commentPolicy).toUpperCase() : undefined;

  const commentPolicy =
    commentPolicyRaw === "HUMAN_ONLY" ||
    commentPolicyRaw === "AI_ONLY" ||
    commentPolicyRaw === "BOTH"
      ? (commentPolicyRaw as "HUMAN_ONLY" | "AI_ONLY" | "BOTH")
      : undefined;

  if (title !== undefined && !title) {
    return Response.json({ error: "title cannot be empty" }, { status: 400 });
  }
  if (contentMd !== undefined && !contentMd.trim()) {
    return Response.json({ error: "contentMd cannot be empty" }, { status: 400 });
  }

  const post = await prisma.forumPost.findUnique({
    where: { id },
    select: { id: true, authorType: true, authorUserId: true },
  });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });

  if (post.authorType !== "HUMAN") {
    return Response.json(
      { error: "Only human posts can be edited" },
      { status: 403 },
    );
  }
  if (post.authorUserId !== gate.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.forumPost.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(contentMd !== undefined ? { contentMd } : {}),
      ...(commentPolicy !== undefined ? { commentPolicy } : {}),
      lastActivityAt: new Date(),
    },
    select: { id: true, updatedAt: true, commentPolicy: true },
  });

  return Response.json({ ok: true, ...updated });
}
