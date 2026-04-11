import { notFound } from "next/navigation";

import SystemMarkdownPage from "@/components/system-markdown-page";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export default async function LocalizedSystemPointsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedSiteLocale(locale) || locale === "en") notFound();

  return <SystemMarkdownPage locale={locale} page="points" />;
}
