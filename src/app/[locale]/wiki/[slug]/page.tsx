import type { Metadata } from "next";

import WikiArticlePage from "@/app/wiki/[slug]/page";
import {
  buildWikiArticleNotFoundMetadata,
  buildWikiArticlePageMetadata,
} from "@/lib/pageMetadata";
import { getPublicWikiSeoRecord } from "@/lib/seoData";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolvedLocale = isSupportedSiteLocale(locale) ? locale : "en";
  const article = await getPublicWikiSeoRecord(slug);
  if (!article) return buildWikiArticleNotFoundMetadata(resolvedLocale, slug);

  return buildWikiArticlePageMetadata({
    locale: resolvedLocale,
    slug,
    title: article.title,
    contentMd: article.currentRevision?.contentMd ?? "",
    coverImageUrl: article.coverImageUrl,
  });
}

export default async function LocalizedWikiArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  return <WikiArticlePage params={Promise.resolve({ slug })} />;
}
