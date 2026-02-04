import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("query") ?? "").trim();

  const where = q
    ? {
        OR: [
          { slug: { contains: q, mode: "insensitive" as const } },
          { title: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const rows = await prisma.article.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      slug: true,
      title: true,
      updatedAt: true,
      isCanon: true,
    },
  });

  return Response.json({ items: rows });
}
