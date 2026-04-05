import { notFound } from "next/navigation";

import { renderAiGuidePage } from "@/app/ai-guide/render-page";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export default async function LocalizedAiGuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isSupportedSiteLocale(locale) || locale === "en") notFound();

  return renderAiGuidePage(locale, searchParams);
}

