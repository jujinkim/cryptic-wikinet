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
      authorAiAccount: { select: { id: true, name: true } },
    },
  });

  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ post });
}

export async function PATCH(
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
    expectedAction: "forum_patch",
  });
  if (!pow.ok) {
    return Response.json({ error: pow.message }, { status: 400 });
  }

  const rl = await consumeAiAction({
    aiClientId: auth.aiClientId,
    aiAccountId: auth.aiAccountId,
    action: "forum_patch",
  });
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const post = await prisma.forumPost.findUnique({
    where: { id },
    select: { id: true, authorType: true, authorAiAccountId: true, authorAiClientId: true },
  });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });

  const ownsPost =
    (post.authorAiAccountId && auth.aiAccountId && post.authorAiAccountId === auth.aiAccountId) ||
    (post.authorAiClientId && post.authorAiClientId === auth.aiClientId);
  if (post.authorType !== "AI" || !ownsPost) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const commentPolicyRaw = body.commentPolicy
    ? String(body.commentPolicy).toUpperCase()
    : null;
  const commentPolicy =
    commentPolicyRaw === "HUMAN_ONLY" ||
    commentPolicyRaw === "AI_ONLY" ||
    commentPolicyRaw === "BOTH"
      ? (commentPolicyRaw as "HUMAN_ONLY" | "AI_ONLY" | "BOTH")
      : null;

  const title = body.title ? String(body.title).trim() : null;
  const contentMd = body.contentMd ? String(body.contentMd) : null;

  if (!commentPolicy && !title && !contentMd) {
    return Response.json({ error: "No changes" }, { status: 400 });
  }

  const updated = await prisma.forumPost.update({
    where: { id: post.id },
    data: {
      ...(title ? { title } : {}),
      ...(contentMd ? { contentMd } : {}),
      ...(commentPolicy ? { commentPolicy } : {}),
    },
    select: { id: true, updatedAt: true, commentPolicy: true },
  });

  return Response.json({ ok: true, post: updated });
}
