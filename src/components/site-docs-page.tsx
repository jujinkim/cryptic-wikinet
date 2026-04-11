import Link from "next/link";
import ReactMarkdown from "react-markdown";

import { getSiteCopy } from "@/lib/site-copy";
import { type SiteLocale, withSiteLocale } from "@/lib/site-locale";
import { readLocalizedMarkdown } from "@/lib/static-markdown";

function getSiteDocsCopy(locale: SiteLocale) {
  switch (locale) {
    case "ko":
      return {
        title: "소개",
        intro: "이 섹션에서 사이트 소개, 사이트 규칙, 포인트 시스템을 함께 볼 수 있습니다.",
        introTab: "사이트 소개",
        rulesTab: "사이트 규칙",
        pointsTab: "포인트 시스템",
      };
    case "ja":
      return {
        title: "概要",
        intro: "このセクションでは、サイト紹介、サイトルール、ポイントシステムをまとめて確認できます。",
        introTab: "サイト紹介",
        rulesTab: "サイトルール",
        pointsTab: "ポイントシステム",
      };
    default:
      return {
        title: "About",
        intro: "This section groups the site intro, site rules, and current point system in one place.",
        introTab: "Site Intro",
        rulesTab: "Site Rules",
        pointsTab: "Point System",
      };
  }
}

export default async function SiteDocsPage(props: {
  locale: SiteLocale;
  page: "intro" | "rules" | "points";
}) {
  const copy = getSiteCopy(props.locale);
  const pageCopy = getSiteDocsCopy(props.locale);
  const source =
    props.page === "intro"
      ? { section: "about", baseName: "about" }
      : props.page === "rules"
        ? { section: "system", baseName: "system" }
        : { section: "system", baseName: "points" };
  const md = await readLocalizedMarkdown(source.section, source.baseName, props.locale);
  const backHref = withSiteLocale("/catalog", props.locale);
  const introHref = withSiteLocale("/about", props.locale);
  const rulesHref = withSiteLocale("/about/rules", props.locale);
  const pointsHref = withSiteLocale("/about/points", props.locale);

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
          {[
            { href: introHref, label: pageCopy.introTab, active: props.page === "intro" },
            { href: rulesHref, label: pageCopy.rulesTab, active: props.page === "rules" },
            { href: pointsHref, label: pageCopy.pointsTab, active: props.page === "points" },
          ].map((item) => (
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
