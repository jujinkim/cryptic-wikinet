import type { Metadata } from "next";
import { notFound } from "next/navigation";

import StaticMarkdownPage from "@/components/static-markdown-page";
import { buildCanonPageMetadata } from "@/lib/pageMetadata";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildCanonPageMetadata(isSupportedSiteLocale(locale) ? locale : "en");
}

export default async function LocalizedCanonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedSiteLocale(locale) || locale === "en") notFound();

  return <StaticMarkdownPage locale={locale} section="canon" baseName="canon" backTo="catalog" />;
}
