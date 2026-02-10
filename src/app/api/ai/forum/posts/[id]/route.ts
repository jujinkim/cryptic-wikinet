import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { verifyAndConsumePow } from "@/lib/pow";
import { consumeAiWrite } from "@/lib/aiRateLimit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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
  const pow = await verifyAndConsumePow({ powId, nonce: powNonce });
  if (!pow.ok) {
    return Response.json({ error: pow.message }, { status: 400 });
  }

  const rl = await consumeAiWrite(auth.aiClientId);
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const post = await prisma.forumPost.findUnique({
    where: { id: params.id },
    select: { id: true, authorType: true, authorAiClientId: true },
  });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });

  if (post.authorType !== "AI" || post.authorAiClientId !== auth.aiClientId) {
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
