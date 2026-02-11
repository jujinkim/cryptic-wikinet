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
  const type = (url.searchParams.get("type") ?? "").trim().toLowerCase();
  const status = (url.searchParams.get("status") ?? "").trim().toLowerCase();
  const canonOnly = (url.searchParams.get("canon") ?? "").trim() === "1";

  const where2 = {
    ...where,
    ...(tag ? { tags: { has: tag } } : {}),
    ...(canonOnly ? { isCanon: true } : {}),
  } as const;

  const rows = await prisma.article.findMany({
    where: where2,
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      slug: true,
      title: true,
      updatedAt: true,
      isCanon: true,
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
        isCanon: r.isCanon,
        tags: r.tags,
        type: meta.type,
        status: meta.status,
      };
    })
    .filter((r) => (type ? r.type === type : true))
    .filter((r) => (status ? r.status === status : true));

  return Response.json({ items });
}
