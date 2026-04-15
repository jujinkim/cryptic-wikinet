import LegalDocumentPage from "@/components/legal-document-page";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  return <LegalDocumentPage locale="en" slug="terms" />;
}
