import { getLegalDocumentDefinitionBySlug, type LegalDocumentSlug } from "@/lib/legalDocuments";
import { getBundledLegalDocument } from "@/lib/legalDocumentDefaults";
import { prisma } from "@/lib/prisma";
import type { SiteLocale } from "@/lib/site-locale";

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

export type ResolvedLegalDocument = {
  contentMd: string;
  revNumber: number | null;
  createdAt: string;
  source: "published" | "bundled";
};

export async function getPublishedLegalDocument(slug: LegalDocumentSlug, locale: SiteLocale) {
  if (isBuildPhase) return null;

  const definition = getLegalDocumentDefinitionBySlug(slug);
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
}

export async function getLegalDocumentContent(
  slug: LegalDocumentSlug,
  locale: SiteLocale,
): Promise<ResolvedLegalDocument | null> {
  const published = await getPublishedLegalDocument(slug, locale);
  if (published) {
    return {
      ...published,
      source: "published",
    };
  }

  try {
    const bundled = await getBundledLegalDocument(slug, locale);
    return {
      contentMd: bundled.contentMd,
      createdAt: bundled.createdAt,
      revNumber: null,
      source: "bundled",
    };
  } catch {
    return null;
  }
}
