import { auth } from "@/auth";
import LegalAdminClient from "@/app/admin/legal/client";
import { getRequestSiteLocale } from "@/lib/request-site-locale";
import { getLegalDocumentPath, getLegalDocumentTitle, listLegalDocuments } from "@/lib/legalDocuments";
import { prisma } from "@/lib/prisma";
import { getSiteCopy } from "@/lib/site-copy";
import { SUPPORTED_SITE_LOCALES, withSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

function Forbidden() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Forbidden</h1>
    </main>
  );
}

export default async function AdminLegalPage() {
  const locale = await getRequestSiteLocale();
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | null)?.id;
  if (!userId) return <Forbidden />;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return <Forbidden />;

  const siteCopy = getSiteCopy(locale);
  const documents = await Promise.all(
    listLegalDocuments().flatMap((definition) =>
      SUPPORTED_SITE_LOCALES.map(async (documentLocale) => {
        const row = await prisma.legalDocument.findUnique({
          where: {
            key_locale: {
              key: definition.dbKey,
              locale: documentLocale,
            },
          },
          select: {
            currentRevision: {
              select: {
                contentMd: true,
                createdAt: true,
                revNumber: true,
              },
            },
            revisions: {
              orderBy: { revNumber: "desc" },
              take: 20,
              select: {
                id: true,
                contentMd: true,
                createdAt: true,
                revNumber: true,
                createdByUser: {
                  select: {
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        return {
          id: `${definition.slug}:${documentLocale}`,
          slug: definition.slug,
          locale: documentLocale,
          localeLabel: siteCopy.languages[documentLocale],
          title: getLegalDocumentTitle(definition.slug, locale),
          publicHref: withSiteLocale(getLegalDocumentPath(definition.slug), documentLocale),
          currentRevision: row?.currentRevision
            ? {
                contentMd: row.currentRevision.contentMd,
                createdAt: row.currentRevision.createdAt.toISOString(),
                revNumber: row.currentRevision.revNumber,
              }
            : null,
          history: (row?.revisions ?? []).map((revision) => ({
            id: revision.id,
            contentMd: revision.contentMd,
            createdAt: revision.createdAt.toISOString(),
            revNumber: revision.revNumber,
            createdBy: revision.createdByUser.name ?? revision.createdByUser.email,
          })),
        };
      }),
    ),
  );

  return (
    <LegalAdminClient
      adminLinks={[
        { href: withSiteLocale("/admin", locale), label: "Overview" },
        { href: withSiteLocale("/admin/reports", locale), label: "Reports" },
        { href: withSiteLocale("/admin/tags", locale), label: "Tags" },
      ]}
      documents={documents}
    />
  );
}
