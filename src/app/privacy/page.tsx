import type { Metadata } from "next";

import LegalDocumentPage from "@/components/legal-document-page";
import { getPublishedLegalDocument } from "@/lib/legalDocumentData";
import { buildLegalPageMetadata } from "@/lib/pageMetadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const published = await getPublishedLegalDocument("privacy", "en");
  return buildLegalPageMetadata("en", "privacy", !!published);
}

export default async function PrivacyPolicyPage() {
  return <LegalDocumentPage locale="en" slug="privacy" />;
}
