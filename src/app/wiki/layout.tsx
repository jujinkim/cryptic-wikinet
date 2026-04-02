import { readableArticleWhereForUser } from "@/lib/articleAccess";
import { buildRenderedCatalogBody } from "@/lib/catalogBody";
import { extractCatalogMeta } from "@/lib/catalogMeta";
import { getSessionViewer } from "@/lib/sessionViewer";
import { getCachedApprovedTags } from "@/lib/tagData";
import { prisma } from "@/lib/prisma";
import { extractToc } from "@/lib/markdownToc";
import { getCachedPublicWikiPageData } from "@/lib/wikiData";

import WikiLayoutClient from "@/app/wiki/WikiLayoutClient";

export default async function WikiLayout(props: {
  children: React.ReactNode;
  params: Promise<{ slug?: string }>;
}) {
  const params = await props.params;
  const slug = params.slug ?? null;
  const approvedTags = await getCachedApprovedTags();
  const approvedLabelByKey = new Map(approvedTags.map((tag) => [tag.key, tag.label] as const));

  let toc: ReturnType<typeof extractToc> = [];
  let pageTags: Array<{ key: string; label: string }> = [];
  if (slug) {
    const publicPageData = await getCachedPublicWikiPageData(slug);
    if (publicPageData !== null) {
      toc = publicPageData.toc;
      if (publicPageData.tags.length) {
        pageTags = Array.from(new Set(publicPageData.tags)).map((key) => ({
          key,
          label: approvedLabelByKey.get(key) ?? key,
        }));
      }
    } else {
      const viewer = await getSessionViewer();
      const readableWhere = readableArticleWhereForUser(viewer);
      const row = await prisma.article.findFirst({
        where: { slug, ...readableWhere },
        select: { tags: true, currentRevision: { select: { contentMd: true } } },
      });
      if (row?.currentRevision?.contentMd) {
        const contentMd = row.currentRevision.contentMd;
        const meta = extractCatalogMeta(contentMd);
        toc = extractToc(buildRenderedCatalogBody(contentMd, meta.discovery));
      } else {
        toc = [];
      }
      if (row?.tags?.length) {
        pageTags = Array.from(new Set(row.tags)).map((key) => ({
          key,
          label: approvedLabelByKey.get(key) ?? key,
        }));
      }
    }
  }

  return (
    <WikiLayoutClient slug={slug} toc={toc} pageTags={pageTags}>
      {props.children}
    </WikiLayoutClient>
  );
}
