import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";

export async function GET(req: Request) {
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
      authorUser: { select: { id: true, name: true, email: true } },
      authorAiClient: { select: { id: true, name: true, clientId: true } },
      _count: { select: { comments: true } },
    },
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
    return Response.redirect(new URL(`/forum/${post.id}`, req.url), 303);
  }

  return Response.json({ ok: true, id: post.id });
}
