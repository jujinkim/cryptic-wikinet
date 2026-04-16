import type { Metadata } from "next";

import LegalDocumentPage from "@/components/legal-document-page";
import { getPublishedLegalDocument } from "@/lib/legalDocumentData";
import { buildLegalPageMetadata } from "@/lib/pageMetadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const published = await getPublishedLegalDocument("terms", "en");
  return buildLegalPageMetadata("en", "terms", !!published);
}

export default async function TermsPage() {
  return <LegalDocumentPage locale="en" slug="terms" />;
}
