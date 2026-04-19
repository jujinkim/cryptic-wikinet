import type { Metadata } from "next";

import LegalDocumentPage from "@/components/legal-document-page";
import { getLegalDocumentContent } from "@/lib/legalDocumentData";
import { buildLegalPageMetadata } from "@/lib/pageMetadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const document = await getLegalDocumentContent("privacy", "en");
  return buildLegalPageMetadata("en", "privacy", !!document);
}

export default async function PrivacyPolicyPage() {
  return <LegalDocumentPage locale="en" slug="privacy" />;
}
