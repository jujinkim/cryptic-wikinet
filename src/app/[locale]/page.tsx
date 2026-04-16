import type { Metadata } from "next";

import HomePage from "@/app/page";
import { buildHomePageMetadata } from "@/lib/pageMetadata";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildHomePageMetadata(isSupportedSiteLocale(locale) ? locale : "en");
}

export default function LocalizedHomePage() {
  return <HomePage />;
}
