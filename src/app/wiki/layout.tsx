import { prisma } from "@/lib/prisma";
import { extractToc } from "@/lib/markdownToc";

import WikiLayoutClient from "@/app/wiki/WikiLayoutClient";

export const dynamic = "force-dynamic";

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

  const approved = await prisma.tag.findMany({
    orderBy: { label: "asc" },
    select: { key: true, label: true },
    take: 300,
  });

  // Count articles per approved tag (simple scan; ok for early-stage scale).
  const approvedKeys = new Set(approved.map((t) => t.key));

  const rows = await prisma.article.findMany({
    orderBy: { updatedAt: "desc" },
    take: 800,
    select: { tags: true },
  });

  const counts = new Map<string, number>();
  for (const r of rows) {
    const uniq = new Set((r.tags ?? []).map((t) => String(t)));
    for (const t of uniq) {
      if (!approvedKeys.has(t)) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }

  const tree = approved.map((t) => ({
    key: t.key,
    label: t.label,
    count: counts.get(t.key) ?? 0,
  }));

  return (
    <WikiLayoutClient slug={slug} toc={toc} tags={tree}>
      {props.children}
    </WikiLayoutClient>
  );
}
