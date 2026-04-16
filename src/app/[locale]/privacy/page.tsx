import type { Metadata } from "next";

import LegalDocumentPage from "@/components/legal-document-page";
import { getPublishedLegalDocument } from "@/lib/legalDocumentData";
import { buildLegalPageMetadata } from "@/lib/pageMetadata";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = isSupportedSiteLocale(locale) ? locale : "en";
  const published = await getPublishedLegalDocument("privacy", resolvedLocale);
  return buildLegalPageMetadata(resolvedLocale, "privacy", !!published);
}

export default async function LocalizedPrivacyPolicyPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  return <LegalDocumentPage locale={isSupportedSiteLocale(locale) ? locale : "en"} slug="privacy" />;
}
