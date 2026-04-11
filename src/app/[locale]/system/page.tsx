import { notFound, redirect } from "next/navigation";

import { isSupportedSiteLocale, withSiteLocale } from "@/lib/site-locale";

export default async function LocalizedSystemPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedSiteLocale(locale) || locale === "en") notFound();

  redirect(withSiteLocale("/about/rules", locale));
}
