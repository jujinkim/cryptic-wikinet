import { notFound } from "next/navigation";

import LocaleDocumentLang from "@/components/locale-document-lang";
import { SUPPORTED_SITE_LOCALES, isSupportedSiteLocale } from "@/lib/site-locale";

export function generateStaticParams() {
  return SUPPORTED_SITE_LOCALES.filter((locale) => locale !== "en").map((locale) => ({ locale }));
}

export default async function LocalizedLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isSupportedSiteLocale(locale) || locale === "en") {
    notFound();
  }

  return (
    <>
      <LocaleDocumentLang locale={locale} />
      {children}
    </>
  );
}

