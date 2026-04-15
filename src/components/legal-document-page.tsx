import Link from "next/link";
import ReactMarkdown from "react-markdown";

import LocalTime from "@/components/local-time";
import { getPublishedLegalDocument } from "@/lib/legalDocumentData";
import { getLegalDocumentTitle, type LegalDocumentSlug } from "@/lib/legalDocuments";
import { getSiteCopy } from "@/lib/site-copy";
import { type SiteLocale, withSiteLocale } from "@/lib/site-locale";

function getPageCopy(locale: SiteLocale) {
  switch (locale) {
    case "ko":
      return {
        lastUpdated: "마지막 업데이트:",
        unpublishedLead: "아직 게시된 문서가 없습니다.",
        unpublishedBody: "관리자가 첫 번째 버전을 게시하면 여기에 표시됩니다.",
      };
    case "ja":
      return {
        lastUpdated: "最終更新:",
        unpublishedLead: "まだ公開された文書がありません。",
        unpublishedBody: "管理者が最初の版を公開すると、ここに表示されます。",
      };
    default:
      return {
        lastUpdated: "Last updated:",
        unpublishedLead: "This document has not been published yet.",
        unpublishedBody: "Once an admin publishes the first revision, it will appear here.",
      };
  }
}

export default async function LegalDocumentPage(props: {
  locale: SiteLocale;
  slug: LegalDocumentSlug;
}) {
  const copy = getSiteCopy(props.locale);
  const pageCopy = getPageCopy(props.locale);
  const title = getLegalDocumentTitle(props.slug, props.locale);
  const published = await getPublishedLegalDocument(props.slug);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-6 text-sm">
        <Link className="underline" href={withSiteLocale("/", props.locale)}>
          {copy.common.backToHome}
        </Link>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          {published ? (
            <>
              {pageCopy.lastUpdated} <LocalTime value={published.createdAt} />
            </>
          ) : (
            pageCopy.unpublishedLead
          )}
        </p>
      </section>

      {published ? (
        <article className="prose prose-zinc mt-6 max-w-none rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950 dark:prose-invert">
          <ReactMarkdown>{published.contentMd}</ReactMarkdown>
        </article>
      ) : (
        <section className="mt-6 rounded-2xl border border-dashed border-black/10 bg-white p-6 text-sm text-zinc-500 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-400">
          {pageCopy.unpublishedBody}
        </section>
      )}
    </main>
  );
}
