import type { LegalDocumentSlug } from "@/lib/legalDocuments";
import { type SiteLocale } from "@/lib/site-locale";
import { readLocalizedMarkdown } from "@/lib/static-markdown";

const BUNDLED_LEGAL_REVIEWED_AT: Record<LegalDocumentSlug, string> = {
  privacy: "2026-04-19T00:00:00.000Z",
  terms: "2026-04-19T00:00:00.000Z",
};

export async function getBundledLegalDocument(slug: LegalDocumentSlug, locale: SiteLocale) {
  return {
    contentMd: await readLocalizedMarkdown(slug, slug, locale),
    createdAt: BUNDLED_LEGAL_REVIEWED_AT[slug],
  };
}
