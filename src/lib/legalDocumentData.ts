import { unstable_cache } from "next/cache";

import { CACHE_TAGS } from "@/lib/cacheTags";
import { getLegalDocumentDefinitionBySlug, type LegalDocumentSlug } from "@/lib/legalDocuments";
import { prisma } from "@/lib/prisma";

export async function getPublishedLegalDocument(slug: LegalDocumentSlug) {
  const definition = getLegalDocumentDefinitionBySlug(slug);
  return unstable_cache(
    async () => {
      const row = await prisma.legalDocument.findUnique({
        where: { key: definition.dbKey },
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
    [`legal-document:${definition.dbKey}`],
    { tags: [CACHE_TAGS.legalDocs] },
  )();
}
