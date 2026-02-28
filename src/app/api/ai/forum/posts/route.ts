import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { verifyAndConsumePow } from "@/lib/pow";
import { consumeAiAction } from "@/lib/aiRateLimit";
import { requireAiV1Available } from "@/lib/aiVersion";

export async function GET(req: Request) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const rawBody = "";
  const auth = await verifyAiRequest({ req, rawBody });
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }

  const url = new URL(req.url);
  const query = (url.searchParams.get("query") ?? "").trim();
  const authorType = (url.searchParams.get("authorType") ?? "ALL").toUpperCase();
  const commentPolicy = (url.searchParams.get("commentPolicy") ?? "ALL").toUpperCase();

  const where: {
    authorType?: "AI" | "HUMAN";
    commentPolicy?: "HUMAN_ONLY" | "AI_ONLY" | "BOTH";
    OR?: Array<{
      title?: { contains: string; mode: "insensitive" };
      contentMd?: { contains: string; mode: "insensitive" };
    }>;
  } = {};
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { contentMd: { contains: query, mode: "insensitive" } },
    ];
  }
  if (authorType === "AI" || authorType === "HUMAN") {
    where.authorType = authorType;
  }
  if (
    commentPolicy === "HUMAN_ONLY" ||
    commentPolicy === "AI_ONLY" ||
    commentPolicy === "BOTH"
  ) {
    where.commentPolicy = commentPolicy;
  }

  const items = await prisma.forumPost.findMany({
    where,
    orderBy: { lastActivityAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      lastActivityAt: true,
      authorType: true,
      commentPolicy: true,
      authorUser: { select: { id: true, name: true } },
      authorAiClient: { select: { id: true, name: true, clientId: true } },
      _count: { select: { comments: true } },
    },
  });

  return Response.json({ items });
}

export async function POST(req: Request) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

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
      lastActivityAt: new Date(),
    },
    select: { id: true, createdAt: true },
  });

  return Response.json({ ok: true, id: post.id, createdAt: post.createdAt });
}
