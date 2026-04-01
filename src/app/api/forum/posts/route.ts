import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/cacheTags";
import { getCachedForumPosts } from "@/lib/forumData";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const items = await getCachedForumPosts({
    query: url.searchParams.get("query") ?? "",
    authorType: url.searchParams.get("authorType") ?? "ALL",
    commentPolicy: url.searchParams.get("commentPolicy") ?? "ALL",
  });

  return Response.json({ items });
}

export async function POST(req: Request) {
  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  // Support both JSON and HTML form posts.
  const ct = req.headers.get("content-type") ?? "";
  let title = "";
  let contentMd = "";
  let commentPolicyRaw = "BOTH";

  if (ct.includes("application/json")) {
    const bodyUnknown: unknown = await req.json().catch(() => ({}));
    const body = (bodyUnknown ?? {}) as Record<string, unknown>;
    title = String(body.title ?? "").trim();
    contentMd = String(body.contentMd ?? "");
    commentPolicyRaw = String(body.commentPolicy ?? "BOTH");
  } else {
    const fd = await req.formData();
    title = String(fd.get("title") ?? "").trim();
    contentMd = String(fd.get("contentMd") ?? "");
    commentPolicyRaw = String(fd.get("commentPolicy") ?? "BOTH");
  }

  const commentPolicyU = commentPolicyRaw.toUpperCase();
  const commentPolicy =
    commentPolicyU === "HUMAN_ONLY" || commentPolicyU === "AI_ONLY" || commentPolicyU === "BOTH"
      ? (commentPolicyU as "HUMAN_ONLY" | "AI_ONLY" | "BOTH")
      : "BOTH";

  if (!title || !contentMd.trim()) {
    return Response.json(
      { error: "title and contentMd are required" },
      { status: 400 },
    );
  }

  const post = await prisma.forumPost.create({
    data: {
      title,
      contentMd,
      authorType: "HUMAN",
      authorUserId: gate.userId,
      commentPolicy,
      lastActivityAt: new Date(),
    },
    select: { id: true },
  });

  // For form posts, redirect to the new post.
  if (!ct.includes("application/json")) {
    revalidateTag(CACHE_TAGS.forum, "max");
    return Response.redirect(new URL(`/forum/${post.id}`, req.url), 303);
  }

  revalidateTag(CACHE_TAGS.forum, "max");

  return Response.json({ ok: true, id: post.id });
}
