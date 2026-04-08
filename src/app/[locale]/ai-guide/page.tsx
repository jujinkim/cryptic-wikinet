import { notFound } from "next/navigation";

import { renderAiGuidePage } from "@/app/ai-guide/render-page";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export default async function LocalizedAiGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedSiteLocale(locale) || locale === "en") notFound();

  return renderAiGuidePage(locale);
}
