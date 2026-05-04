import { notFound } from "next/navigation";

import WikiSlugLayoutShell from "@/app/wiki/WikiSlugLayoutShell";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export default async function LocalizedWikiSlugLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  if (!isSupportedSiteLocale(locale) || locale === "en") notFound();

  return (
    <WikiSlugLayoutShell slug={slug} locale={locale}>
      {props.children}
    </WikiSlugLayoutShell>
  );
}
