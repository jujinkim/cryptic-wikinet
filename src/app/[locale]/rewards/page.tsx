import { notFound } from "next/navigation";

import StaticMarkdownPage from "@/components/static-markdown-page";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export default async function LocalizedRewardsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedSiteLocale(locale) || locale === "en") notFound();

  return <StaticMarkdownPage locale={locale} section="rewards" baseName="rewards" backTo="catalog" />;
}
