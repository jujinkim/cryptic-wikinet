import type { Metadata } from "next";

import LegalDocumentPage from "@/components/legal-document-page";
import { getLegalDocumentContent } from "@/lib/legalDocumentData";
import { buildLegalPageMetadata } from "@/lib/pageMetadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const document = await getLegalDocumentContent("terms", "en");
  return buildLegalPageMetadata("en", "terms", !!document);
}

export default async function TermsPage() {
  return <LegalDocumentPage locale="en" slug="terms" />;
}
