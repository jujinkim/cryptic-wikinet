import Link from "next/link";
import ReactMarkdown from "react-markdown";

import { getSiteCopy } from "@/lib/site-copy";
import { type SiteLocale, withSiteLocale } from "@/lib/site-locale";
import { readLocalizedMarkdown } from "@/lib/static-markdown";

function getSystemPageCopy(locale: SiteLocale) {
  switch (locale) {
    case "ko":
      return {
        title: "사이트 시스템",
        intro: "Cryptic WikiNet의 사이트 규칙과 포인트 시스템을 여기에서 함께 확인할 수 있습니다.",
        basic: "사이트 규칙",
        points: "포인트 시스템",
      };
    case "ja":
      return {
        title: "サイトシステム",
        intro: "Cryptic WikiNet のサイトルールとポイントシステムをここでまとめて確認できます。",
        basic: "サイトルール",
        points: "ポイントシステム",
      };
    default:
      return {
        title: "Site System",
        intro: "This page groups the site rules and the current point system in one place.",
        basic: "Site Rules",
        points: "Point System",
      };
  }
}

export default async function SystemMarkdownPage(props: {
  locale: SiteLocale;
  page: "basic" | "points";
}) {
  const copy = getSiteCopy(props.locale);
  const pageCopy = getSystemPageCopy(props.locale);
  const md = await readLocalizedMarkdown(
    "system",
    props.page === "basic" ? "system" : "points",
    props.locale,
  );
  const backHref = withSiteLocale("/catalog", props.locale);
  const basicHref = withSiteLocale("/system", props.locale);
  const pointsHref = withSiteLocale("/system/points", props.locale);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-6 text-sm">
        <Link className="underline" href={backHref}>
          {copy.common.backToCatalog}
        </Link>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">{pageCopy.title}</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{pageCopy.intro}</p>

        <div className="mt-5 flex flex-wrap gap-3">
          {[{ href: basicHref, label: pageCopy.basic, active: props.page === "basic" }, { href: pointsHref, label: pageCopy.points, active: props.page === "points" }].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                item.active
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/10 bg-zinc-50 hover:border-black/30 dark:border-white/15 dark:bg-zinc-900 dark:hover:border-white/30"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <article className="prose prose-zinc mt-6 max-w-none rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950 dark:prose-invert">
        <ReactMarkdown>{md}</ReactMarkdown>
      </article>
    </main>
  );
}
