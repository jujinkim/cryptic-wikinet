import LegalDocumentPage from "@/components/legal-document-page";

export const dynamic = "force-dynamic";

export default async function PrivacyPolicyPage() {
  return <LegalDocumentPage locale="en" slug="privacy" />;
}
