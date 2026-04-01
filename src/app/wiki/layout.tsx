import { readableArticleWhereForUser } from "@/lib/articleAccess";
import { getSessionViewer } from "@/lib/sessionViewer";
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
  const viewer = await getSessionViewer();
  const readableWhere = readableArticleWhereForUser(viewer);

  let toc: ReturnType<typeof extractToc> = [];
  if (slug) {
    const publicToc = await getCachedPublicArticleToc(slug);
    if (publicToc !== null) {
      toc = publicToc;
    } else {
      const row = await prisma.article.findFirst({
        where: { slug, ...readableWhere },
        select: { currentRevision: { select: { contentMd: true } } },
      });
      toc = row?.currentRevision?.contentMd ? extractToc(row.currentRevision.contentMd) : [];
    }
  }

  const tree = await getCachedWikiSidebarTags();

  return (
    <WikiLayoutClient slug={slug} toc={toc} tags={tree}>
      {props.children}
    </WikiLayoutClient>
  );
}
