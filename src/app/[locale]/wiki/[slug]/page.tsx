import type { Metadata } from "next";

import WikiArticlePage from "@/app/wiki/[slug]/page";
import {
  buildWikiArticleNotFoundMetadata,
  buildWikiArticlePageMetadata,
} from "@/lib/pageMetadata";
import { pickBestArticleTranslation } from "@/lib/articleTranslation";
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
  const selectedTranslation = pickBestArticleTranslation(
    article.currentRevision?.translations ?? [],
    resolvedLocale,
    article.mainLanguage ?? article.currentRevision?.mainLanguage ?? null,
  );

  return buildWikiArticlePageMetadata({
    locale: resolvedLocale,
    slug,
    title: selectedTranslation?.title ?? article.title,
    contentMd: selectedTranslation?.contentMd ?? article.currentRevision?.contentMd ?? "",
    coverImageUrl: article.coverImageUrl,
  });
}

export default async function LocalizedWikiArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  return <WikiArticlePage params={Promise.resolve({ slug })} searchParams={searchParams} />;
}
