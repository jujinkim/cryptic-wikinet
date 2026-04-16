import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { renderAiGuidePage } from "@/app/ai-guide/render-page";
import { buildAiGuidePageMetadata } from "@/lib/pageMetadata";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildAiGuidePageMetadata(isSupportedSiteLocale(locale) ? locale : "en");
}

export default async function LocalizedAiGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedSiteLocale(locale) || locale === "en") notFound();

  return renderAiGuidePage(locale);
}
