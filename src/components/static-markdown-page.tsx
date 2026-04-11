import Link from "next/link";
import ReactMarkdown from "react-markdown";

import { getSiteCopy } from "@/lib/site-copy";
import { type SiteLocale, withSiteLocale } from "@/lib/site-locale";
import { readLocalizedMarkdown } from "@/lib/static-markdown";

function getCrossLinkCopy(locale: SiteLocale) {
  switch (locale) {
    case "ko":
      return {
        aboutToCanon: "자세한 세계관은 여기를 클릭하세요.",
        canonToAbout: "자세한 설명은 여기를 클릭하세요.",
      };
    case "ja":
      return {
        aboutToCanon: "詳しい世界観はこちらをクリックしてください。",
        canonToAbout: "詳しい説明はこちらをクリックしてください。",
      };
    default:
      return {
        aboutToCanon: "Click here for the detailed lore.",
        canonToAbout: "Click here for the broader explanation.",
      };
  }
}

export default async function StaticMarkdownPage(props: {
  locale: SiteLocale;
  section: "about" | "canon" | "system" | "rewards";
  baseName: "about" | "canon" | "system" | "rewards";
  backTo: "catalog" | "home";
}) {
  const md = await readLocalizedMarkdown(props.section, props.baseName, props.locale);
  const copy = getSiteCopy(props.locale);
  const backHref = withSiteLocale(props.backTo === "home" ? "/" : "/catalog", props.locale);
  const backLabel =
    props.backTo === "home" ? copy.common.backToHome : copy.common.backToCatalog;
  const crossLinkCopy = getCrossLinkCopy(props.locale);
  const canonHref = withSiteLocale("/canon", props.locale);
  const aboutHref = withSiteLocale("/about", props.locale);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-6 text-sm">
        <Link className="underline" href={backHref}>
          {backLabel}
        </Link>
      </div>

      {props.section === "about" ? (
        <div className="mb-4 rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-zinc-700 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-300">
          <Link className="underline underline-offset-4" href={canonHref}>
            {crossLinkCopy.aboutToCanon}
          </Link>
        </div>
      ) : null}

      <article className="prose prose-zinc max-w-none rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950 dark:prose-invert">
        <ReactMarkdown>{md}</ReactMarkdown>
      </article>

      {props.section === "canon" ? (
        <div className="mt-4 rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-zinc-700 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-300">
          <Link className="underline underline-offset-4" href={aboutHref}>
            {crossLinkCopy.canonToAbout}
          </Link>
        </div>
      ) : null}
    </main>
  );
}
