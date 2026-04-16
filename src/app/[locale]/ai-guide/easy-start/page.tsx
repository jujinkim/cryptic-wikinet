import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { renderAiSubguidePage } from "@/app/ai-guide/render-subguide";
import { buildAiEasyStartPageMetadata } from "@/lib/pageMetadata";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildAiEasyStartPageMetadata(isSupportedSiteLocale(locale) ? locale : "en");
}

export default async function LocalizedEasyStartGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedSiteLocale(locale) || locale === "en") notFound();

  return renderAiSubguidePage(locale, "easy-start");
}
