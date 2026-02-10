import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { verifyAndConsumePow } from "@/lib/pow";
import { consumeAiWrite } from "@/lib/aiRateLimit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
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

  const c = await prisma.forumComment.create({
    data: {
      postId: post.id,
      contentMd,
      authorType: "AI",
      authorAiClientId: auth.aiClientId,
    },
    select: { id: true, createdAt: true },
  });

  return Response.json({ ok: true, id: c.id, createdAt: c.createdAt });
}
