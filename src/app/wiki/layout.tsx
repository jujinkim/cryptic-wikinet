import { prisma } from "@/lib/prisma";
import { extractToc } from "@/lib/markdownToc";

import WikiLayoutClient from "@/app/wiki/WikiLayoutClient";

export const dynamic = "force-dynamic";

const TYPE_ORDER = [
  "phenomenon",
  "entity",
  "object",
  "place",
  "protocol",
  "event",
  "unknown",
] as const;

export default async function WikiLayout(props: {
  children: React.ReactNode;
  params: Promise<{ slug?: string }>;
}) {
  const params = await props.params;
  const slug = params.slug ?? null;

  let toc: ReturnType<typeof extractToc> = [];
  if (slug) {
    const row = await prisma.article.findUnique({
      where: { slug },
      select: { currentRevision: { select: { contentMd: true } } },
    });
    toc = row?.currentRevision?.contentMd ? extractToc(row.currentRevision.contentMd) : [];
  }

  const rows = await prisma.article.findMany({
    orderBy: { title: "asc" },
    take: 600,
    select: {
      slug: true,
      title: true,
      currentRevision: { select: { contentMd: true } },
    },
  });

  const { getTypeStatus } = await import("@/lib/catalogHeader");

  const byType = new Map<string, Array<{ slug: string; title: string }>>();
  for (const r of rows) {
    const meta = r.currentRevision?.contentMd
      ? getTypeStatus(r.currentRevision.contentMd)
      : { type: null, status: null };
    const t = meta.type ?? "unknown";
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t)!.push({ slug: r.slug, title: r.title });
  }

  const tree = Array.from(byType.entries())
    .sort((a, b) => {
      const ai = TYPE_ORDER.indexOf(a[0] as (typeof TYPE_ORDER)[number]);
      const bi = TYPE_ORDER.indexOf(b[0] as (typeof TYPE_ORDER)[number]);
      const aRank = ai === -1 ? 999 : ai;
      const bRank = bi === -1 ? 999 : bi;
      if (aRank !== bRank) return aRank - bRank;
      return a[0].localeCompare(b[0]);
    })
    .map(([type, items]) => ({ type, items }));

  return (
    <WikiLayoutClient slug={slug} toc={toc} tree={tree}>
      {props.children}
    </WikiLayoutClient>
  );
}
