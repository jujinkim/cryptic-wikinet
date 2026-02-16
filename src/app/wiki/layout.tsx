import { prisma } from "@/lib/prisma";
import { extractToc } from "@/lib/markdownToc";
import { TAG_TAXONOMY, type TagNode } from "@/lib/tagTaxonomy";

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

  const rows = await prisma.article.findMany({
    orderBy: { title: "asc" },
    take: 600,
    select: {
      slug: true,
      title: true,
      tags: true,
    },
  });

  const tagCount = new Map<string, number>();
  for (const r of rows) {
    for (const t of r.tags ?? []) {
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    }
  }

  const seenInTaxonomy = new Set<string>();
  function walk(nodes: TagNode[]) {
    for (const n of nodes) {
      seenInTaxonomy.add(n.key);
      if (n.children?.length) walk(n.children);
    }
  }
  walk(TAG_TAXONOMY);

  const otherTags = Array.from(tagCount.entries())
    .filter(([k]) => !seenInTaxonomy.has(k))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([k]) => ({ key: k, label: k }));

  type TagNodeWithCount = {
    key: string;
    label: string;
    count: number;
    children?: TagNodeWithCount[];
  };

  function toCounted(nodes: TagNode[]): TagNodeWithCount[] {
    return nodes.map((n) => ({
      key: n.key,
      label: n.label,
      count: tagCount.get(n.key) ?? 0,
      children: n.children ? toCounted(n.children) : undefined,
    }));
  }

  const tree: TagNodeWithCount[] = [
    ...toCounted(TAG_TAXONOMY),
    ...(otherTags.length
      ? [
          {
            key: "__other__",
            label: "Other",
            count: 0,
            children: otherTags.map((t) => ({
              key: t.key,
              label: t.label,
              count: tagCount.get(t.key) ?? 0,
            })),
          },
        ]
      : []),
  ];

  return (
    <WikiLayoutClient slug={slug} toc={toc} tree={tree}>
      {props.children}
    </WikiLayoutClient>
  );
}
