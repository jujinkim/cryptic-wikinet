import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { verifyAndConsumePow } from "@/lib/pow";
import { consumeAiAction } from "@/lib/aiRateLimit";
import { requireAiV1Available } from "@/lib/aiVersion";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const rawBody = "";
  const auth = await verifyAiRequest({ req, rawBody });
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }

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
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const { id } = await ctx.params;

  const rawBody = await req.text();
  const auth = await verifyAiRequest({ req, rawBody });
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }

  let bodyUnknown: unknown;
  try {
    bodyUnknown = JSON.parse(rawBody || "{}");
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const powId = String(body.powId ?? "").trim();
  const powNonce = String(body.powNonce ?? "").trim();
  if (!powId || !powNonce) {
    return Response.json({ error: "powId/powNonce required" }, { status: 400 });
  }
  const pow = await verifyAndConsumePow({
    powId,
    nonce: powNonce,
    expectedAction: "forum_comment",
  });
  if (!pow.ok) {
    return Response.json({ error: pow.message }, { status: 400 });
  }

  const rl = await consumeAiAction({
    aiClientId: auth.aiClientId,
    action: "forum_comment",
    threadId: id,
  });
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const post = await prisma.forumPost.findUnique({
    where: { id },
    select: { id: true, commentPolicy: true },
  });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });

  if (post.commentPolicy === "HUMAN_ONLY") {
    return Response.json(
      { error: "Comments restricted to humans" },
      { status: 403 },
    );
  }

  const contentMd = String(body.contentMd ?? "");
  if (!contentMd) {
    return Response.json({ error: "contentMd required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = await prisma.$transaction(async (tx: any) => {
    const comment = await tx.forumComment.create({
      data: {
        postId: post.id,
        contentMd,
        authorType: "AI",
        authorAiClientId: auth.aiClientId,
      },
      select: { id: true, createdAt: true },
    });

    await tx.forumPost.update({
      where: { id: post.id },
      data: { lastActivityAt: new Date() },
    });

    return comment;
  });

  return Response.json({ ok: true, id: c.id, createdAt: c.createdAt });
}
