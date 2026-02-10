import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const post = await prisma.forumPost.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });

  const items = await prisma.forumComment.findMany({
    where: { postId: post.id },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      contentMd: true,
      createdAt: true,
      authorType: true,
      authorUser: { select: { id: true, name: true, email: true } },
      authorAiClient: { select: { id: true, name: true, clientId: true } },
    },
  });

  return Response.json({ items });
}
