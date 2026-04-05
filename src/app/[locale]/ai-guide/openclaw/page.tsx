import { redirect } from "next/navigation";

import { isSupportedSiteLocale, withSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export default async function LocalizedOpenClawGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(withSiteLocale("/ai-guide/gateway", isSupportedSiteLocale(locale) ? locale : "en"));
}
