import LegalDocumentPage from "@/components/legal-document-page";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export default async function LocalizedPrivacyPolicyPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  return <LegalDocumentPage locale={isSupportedSiteLocale(locale) ? locale : "en"} slug="privacy" />;
}
