import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.tag.findMany({
    orderBy: { label: "asc" },
    take: 500,
    select: { key: true, label: true },
  });

  return Response.json({ items });
}
