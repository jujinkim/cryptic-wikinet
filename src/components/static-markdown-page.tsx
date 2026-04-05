import Link from "next/link";
import ReactMarkdown from "react-markdown";

import { getSiteCopy } from "@/lib/site-copy";
import { type SiteLocale } from "@/lib/site-locale";
import { readLocalizedMarkdown } from "@/lib/static-markdown";

export default async function StaticMarkdownPage(props: {
  locale: SiteLocale;
  section: "about" | "canon" | "system";
  baseName: "about" | "canon" | "system";
  backTo: "catalog" | "home";
}) {
  const md = await readLocalizedMarkdown(props.section, props.baseName, props.locale);
  const copy = getSiteCopy(props.locale);
  const backHref = props.backTo === "home" ? "/" : "/";
  const backLabel =
    props.backTo === "home" ? copy.common.backToHome : copy.common.backToCatalog;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-6 text-sm">
        <Link className="underline" href={backHref}>
          {backLabel}
        </Link>
      </div>

      <article className="prose prose-zinc max-w-none rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950 dark:prose-invert">
        <ReactMarkdown>{md}</ReactMarkdown>
      </article>
    </main>
  );
}

