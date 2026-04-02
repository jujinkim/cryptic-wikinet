import { readableArticleWhereForUser } from "@/lib/articleAccess";
import { getSessionViewer } from "@/lib/sessionViewer";
import { getCachedApprovedTags } from "@/lib/tagData";
import { prisma } from "@/lib/prisma";
import { extractToc } from "@/lib/markdownToc";
import { getCachedPublicArticleToc, getCachedWikiSidebarTags } from "@/lib/wikiData";

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
  let pageTags: Array<{ key: string; label: string; approved: boolean }> = [];
  if (slug) {
    const publicToc = await getCachedPublicArticleToc(slug);
    if (publicToc !== null) {
      toc = publicToc;
      const publicRow = await prisma.article.findFirst({
        where: { slug, isPublic: true, lifecycle: "PUBLIC_ACTIVE" },
        select: { tags: true },
      });
      if (publicRow?.tags?.length) {
        pageTags = Array.from(new Set(publicRow.tags)).map((key) => ({
          key,
          label: approvedLabelByKey.get(key) ?? key,
          approved: approvedLabelByKey.has(key),
        }));
      }
    } else {
      const viewer = await getSessionViewer();
      const readableWhere = readableArticleWhereForUser(viewer);
      const row = await prisma.article.findFirst({
        where: { slug, ...readableWhere },
        select: { tags: true, currentRevision: { select: { contentMd: true } } },
      });
      toc = row?.currentRevision?.contentMd ? extractToc(row.currentRevision.contentMd) : [];
      if (row?.tags?.length) {
        pageTags = Array.from(new Set(row.tags)).map((key) => ({
          key,
          label: approvedLabelByKey.get(key) ?? key,
          approved: approvedLabelByKey.has(key),
        }));
      }
    }
  }

  const tree = await getCachedWikiSidebarTags();

  return (
    <WikiLayoutClient slug={slug} toc={toc} pageTags={pageTags} tags={tree}>
      {props.children}
    </WikiLayoutClient>
  );
}
