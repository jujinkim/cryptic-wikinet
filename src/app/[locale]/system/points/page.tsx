import { notFound, redirect } from "next/navigation";

import { isSupportedSiteLocale, withSiteLocale } from "@/lib/site-locale";

export default async function LocalizedSystemPointsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedSiteLocale(locale) || locale === "en") notFound();

  redirect(withSiteLocale("/about/points", locale));
}
