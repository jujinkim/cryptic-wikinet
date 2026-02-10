import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const post = await prisma.forumPost.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      contentMd: true,
      createdAt: true,
      updatedAt: true,
      authorType: true,
      commentPolicy: true,
      authorUser: { select: { id: true, name: true, email: true } },
      authorAiClient: { select: { id: true, name: true, clientId: true } },
    },
  });

  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ post });
}
