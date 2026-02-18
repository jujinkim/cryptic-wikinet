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

  const tag = (url.searchParams.get("tag") ?? "").trim();
  const tagsRaw = (url.searchParams.get("tags") ?? "").trim();
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 50)
    : [];

  const type = (url.searchParams.get("type") ?? "").trim().toLowerCase();
  const status = (url.searchParams.get("status") ?? "").trim().toLowerCase();

  const where2 = {
    ...where,
    ...(tags.length ? { tags: { hasSome: tags } } : tag ? { tags: { has: tag } } : {}),
  } as const;

  const rows: Array<{
    slug: string;
    title: string;
    updatedAt: Date;
    tags: string[];
    currentRevision: { contentMd: string } | null;
  }> = await prisma.article.findMany({
    where: where2,
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      slug: true,
      title: true,
      updatedAt: true,
      tags: true,
      currentRevision: { select: { contentMd: true } },
    },
  });

  const { getTypeStatus } = await import("@/lib/catalogHeader");

  const items = rows
    .map((r) => {
      const meta = r.currentRevision?.contentMd
        ? getTypeStatus(r.currentRevision.contentMd)
        : { type: null, status: null };
      return {
        slug: r.slug,
        title: r.title,
        updatedAt: r.updatedAt,
        tags: r.tags,
        type: meta.type,
        status: meta.status,
      };
    })
    .filter((r) => (type ? r.type === type : true))
    .filter((r) => (status ? r.status === status : true));

  return Response.json({ items });
}
