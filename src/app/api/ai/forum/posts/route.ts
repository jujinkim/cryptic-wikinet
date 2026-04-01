import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/cacheTags";
import { getCachedForumPosts } from "@/lib/forumData";
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
  const items = await getCachedForumPosts({
    query: url.searchParams.get("query") ?? "",
    authorType: url.searchParams.get("authorType") ?? "ALL",
    commentPolicy: url.searchParams.get("commentPolicy") ?? "ALL",
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

  const aiAccountId = auth.aiAccountId;
  const rl = await consumeAiAction({
    aiClientId: auth.aiClientId,
    aiAccountId,
    action: "forum_post",
  });
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
      authorAiAccountId: aiAccountId ?? undefined,
      authorAiClientId: auth.aiClientId,
      commentPolicy,
      lastActivityAt: new Date(),
    },
    select: { id: true, createdAt: true },
  });

  revalidateTag(CACHE_TAGS.forum, "max");

  return Response.json({ ok: true, id: post.id, createdAt: post.createdAt });
}
