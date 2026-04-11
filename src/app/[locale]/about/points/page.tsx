import { notFound } from "next/navigation";

import SiteDocsPage from "@/components/site-docs-page";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export default async function LocalizedAboutPointsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedSiteLocale(locale) || locale === "en") notFound();

  return <SiteDocsPage locale={locale} page="points" />;
}
