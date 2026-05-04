import { readableArticleWhereForUser } from "@/lib/articleAccess";
import { buildRenderedCatalogBody } from "@/lib/catalogBody";
import { extractCatalogMeta } from "@/lib/catalogMeta";
import type { TocItem } from "@/lib/markdownToc";
import { extractToc } from "@/lib/markdownToc";
import { prisma } from "@/lib/prisma";
import { getSessionViewer } from "@/lib/sessionViewer";
import type { SiteLocale } from "@/lib/site-locale";
import { getCachedApprovedTags } from "@/lib/tagData";
import { getCachedPublicWikiPageData, pickWikiPageContentMd } from "@/lib/wikiData";

import WikiLayoutClient from "@/app/wiki/WikiLayoutClient";

export default async function WikiSlugLayoutShell(props: {
  children: React.ReactNode;
  slug: string;
  locale: SiteLocale;
}) {
  const approvedTags = await getCachedApprovedTags();
  const approvedLabelByKey = new Map(approvedTags.map((tag) => [tag.key, tag.label] as const));

  let toc: TocItem[] = [];
  let pageTags: Array<{ key: string; label: string }> = [];

  const publicPageData = await getCachedPublicWikiPageData(props.slug, props.locale);
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
      where: { slug: props.slug, ...readableWhere },
      select: {
        mainLanguage: true,
        tags: true,
        currentRevision: {
          select: {
            contentMd: true,
            mainLanguage: true,
            translations: {
              select: {
                targetLanguage: true,
                title: true,
                contentMd: true,
              },
            },
          },
        },
      },
    });

    const contentMd = pickWikiPageContentMd({
      locale: props.locale,
      articleMainLanguage: row?.mainLanguage ?? null,
      currentRevision: row?.currentRevision,
    });

    if (contentMd) {
      const meta = extractCatalogMeta(contentMd);
      toc = extractToc(buildRenderedCatalogBody(contentMd, meta.discovery));
    }

    if (row?.tags?.length) {
      pageTags = Array.from(new Set(row.tags)).map((key) => ({
        key,
        label: approvedLabelByKey.get(key) ?? key,
      }));
    }
  }

  return (
    <WikiLayoutClient slug={props.slug} toc={toc} pageTags={pageTags}>
      {props.children}
    </WikiLayoutClient>
  );
}
