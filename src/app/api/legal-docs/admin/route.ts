import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/cacheTags";
import { getLegalDocumentDefinitionBySlug, isLegalDocumentSlug } from "@/lib/legalDocuments";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/requireAdminUser";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export async function POST(req: Request) {
  const gate = await requireAdminUser();
  if ("res" in gate) return gate.res;

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const slug = String(body.slug ?? "").trim();
  const localeRaw = String(body.locale ?? "").trim();
  const contentMd = String(body.contentMd ?? "");

  if (!isLegalDocumentSlug(slug)) {
    return Response.json({ error: "Invalid document." }, { status: 400 });
  }
  if (!isSupportedSiteLocale(localeRaw)) {
    return Response.json({ error: "Invalid locale." }, { status: 400 });
  }
  if (!contentMd.trim()) {
    return Response.json({ error: "Content is required." }, { status: 400 });
  }

  const locale = localeRaw;
  const definition = getLegalDocumentDefinitionBySlug(slug);
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.legalDocument.findUnique({
      where: {
        key_locale: {
          key: definition.dbKey,
          locale,
        },
      },
      select: {
        id: true,
        currentRevision: {
          select: {
            contentMd: true,
            revNumber: true,
          },
        },
      },
    });

    if (existing?.currentRevision?.contentMd === contentMd) {
      return {
        unchanged: true,
        revNumber: existing.currentRevision.revNumber,
      };
    }

    const documentId = existing?.id
      ? existing.id
      : (
          await tx.legalDocument.create({
            data: { key: definition.dbKey, locale },
            select: { id: true },
          })
        ).id;

    const previous = await tx.legalDocumentRevision.findFirst({
      where: { documentId },
      orderBy: { revNumber: "desc" },
      select: { revNumber: true },
    });

    const revision = await tx.legalDocumentRevision.create({
      data: {
        documentId,
        revNumber: (previous?.revNumber ?? 0) + 1,
        contentMd,
        createdByUserId: gate.userId,
      },
      select: {
        id: true,
        revNumber: true,
      },
    });

    await tx.legalDocument.update({
      where: { id: documentId },
      data: { currentRevisionId: revision.id },
    });

    return {
      unchanged: false,
      revNumber: revision.revNumber,
    };
  });

  if (!result.unchanged) {
    revalidateTag(CACHE_TAGS.legalDocs, "max");
  }

  return Response.json({
    ok: true,
    slug,
    locale,
    unchanged: result.unchanged,
    revNumber: result.revNumber,
  });
}
