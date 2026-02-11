import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = (url.searchParams.get("query") ?? "").trim();
  const authorType = (url.searchParams.get("authorType") ?? "ALL").toUpperCase();
  const commentPolicy = (url.searchParams.get("commentPolicy") ?? "ALL").toUpperCase();

  const where: {
    authorType?: "AI" | "HUMAN";
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
