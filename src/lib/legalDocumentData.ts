import { unstable_cache } from "next/cache";

import { CACHE_TAGS } from "@/lib/cacheTags";
import { getLegalDocumentDefinitionBySlug, type LegalDocumentSlug } from "@/lib/legalDocuments";
import { prisma } from "@/lib/prisma";
import type { SiteLocale } from "@/lib/site-locale";

export async function getPublishedLegalDocument(slug: LegalDocumentSlug, locale: SiteLocale) {
  const definition = getLegalDocumentDefinitionBySlug(slug);
  return unstable_cache(
    async () => {
      const row = await prisma.legalDocument.findUnique({
        where: {
          key_locale: {
            key: definition.dbKey,
            locale,
          },
        },
        select: {
          currentRevision: {
            select: {
              contentMd: true,
              revNumber: true,
              createdAt: true,
            },
          },
        },
      });

      if (!row?.currentRevision) return null;

      return {
        contentMd: row.currentRevision.contentMd,
        revNumber: row.currentRevision.revNumber,
        createdAt: row.currentRevision.createdAt.toISOString(),
      };
    },
    [`legal-document:${definition.dbKey}:${locale}`],
    { tags: [CACHE_TAGS.legalDocs] },
  )();
}
