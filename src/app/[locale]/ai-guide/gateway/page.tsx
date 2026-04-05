import { notFound } from "next/navigation";

import { renderAiSubguidePage } from "@/app/ai-guide/render-subguide";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export default async function LocalizedGatewayGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedSiteLocale(locale) || locale === "en") notFound();

  return renderAiSubguidePage(locale, "gateway");
}
