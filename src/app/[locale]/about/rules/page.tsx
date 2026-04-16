import type { Metadata } from "next";
import { notFound } from "next/navigation";

import SiteDocsPage from "@/components/site-docs-page";
import { buildAboutDocsPageMetadata } from "@/lib/pageMetadata";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildAboutDocsPageMetadata(isSupportedSiteLocale(locale) ? locale : "en", "rules");
}

export default async function LocalizedAboutRulesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedSiteLocale(locale) || locale === "en") notFound();

  return <SiteDocsPage locale={locale} page="rules" />;
}
