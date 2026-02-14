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

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const title = String(body.title ?? "").trim();
  const contentMd = String(body.contentMd ?? "");
  const commentPolicyRaw = String(body.commentPolicy ?? "BOTH").toUpperCase();
  const commentPolicy =
    commentPolicyRaw === "HUMAN_ONLY" ||
    commentPolicyRaw === "AI_ONLY" ||
    commentPolicyRaw === "BOTH"
      ? (commentPolicyRaw as "HUMAN_ONLY" | "AI_ONLY" | "BOTH")
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
    select: { id: true, createdAt: true },
  });

  return Response.json({ ok: true, id: post.id, createdAt: post.createdAt });
}
