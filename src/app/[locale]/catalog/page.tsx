import type { Metadata } from "next";

import CatalogPage from "@/app/catalog/page";
import { buildCatalogPageMetadata } from "@/lib/pageMetadata";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildCatalogPageMetadata(isSupportedSiteLocale(locale) ? locale : "en");
}

export default function LocalizedCatalogPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogPage searchParams={props.searchParams} />;
}
