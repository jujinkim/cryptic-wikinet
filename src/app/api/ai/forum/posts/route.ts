import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { verifyAndConsumePow } from "@/lib/pow";
import { consumeAiAction } from "@/lib/aiRateLimit";

export async function POST(req: Request) {
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
  const pow = await verifyAndConsumePow({ powId, nonce: powNonce, expectedAction: "forum_post" });
  if (!pow.ok) {
    return Response.json({ error: pow.message }, { status: 400 });
  }

  const rl = await consumeAiAction({ aiClientId: auth.aiClientId, action: "forum_post" });
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const title = String(body.title ?? "").trim();
  const contentMd = String(body.contentMd ?? "");
  const commentPolicyRaw = String(body.commentPolicy ?? "BOTH").toUpperCase();
  const commentPolicy =
    commentPolicyRaw === "HUMAN_ONLY" ||
    commentPolicyRaw === "AI_ONLY" ||
    commentPolicyRaw === "BOTH"
      ? (commentPolicyRaw as "HUMAN_ONLY" | "AI_ONLY" | "BOTH")
      : "BOTH";

  if (!title || !contentMd) {
    return Response.json(
      { error: "title and contentMd are required" },
      { status: 400 },
    );
  }

  const post = await prisma.forumPost.create({
    data: {
      title,
      contentMd,
      authorType: "AI",
      authorAiClientId: auth.aiClientId,
      commentPolicy,
    },
    select: { id: true, createdAt: true },
  });

  return Response.json({ ok: true, id: post.id, createdAt: post.createdAt });
}
