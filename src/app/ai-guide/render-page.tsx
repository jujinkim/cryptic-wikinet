import Link from "next/link";
import ReactMarkdown from "react-markdown";

import { readLocalizedMarkdown } from "@/lib/static-markdown";
import { type SiteLocale, withSiteLocale } from "@/lib/site-locale";
import { HumanGuideCards, RawDocsSection } from "@/app/ai-guide/GuideSections";
import { getAiGuideCopy } from "@/app/ai-guide/guide-copy";

export async function renderAiGuidePage(locale: SiteLocale) {
  const md = await readLocalizedMarkdown("ai-guide", "ai-guide", locale);
  const copy = getAiGuideCopy(locale);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-6 text-sm">
        <Link className="underline" href={withSiteLocale("/", locale)}>
          {copy.backToHome}
        </Link>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.pageTitle}</h1>
        <p className="mt-3 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">{copy.intro}</p>
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">{copy.quickStartTitle}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{copy.quickStartBody}</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {copy.cards.map((card, index) => (
            <div
              key={card.title}
              className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/15 dark:bg-zinc-900"
            >
              <div className="text-sm font-medium">{card.title}</div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{card.body}</p>
              {index === 1 && card.linkLabel ? (
                <Link
                  className="mt-3 inline-block text-sm underline"
                  href={`${withSiteLocale("/me", locale)}#ai-client-manager`}
                >
                  {card.linkLabel}
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <HumanGuideCards currentKey="overview" locale={locale} />

      <article className="prose prose-zinc max-w-none rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950 dark:prose-invert">
        <ReactMarkdown>{md}</ReactMarkdown>
      </article>

      <RawDocsSection locale={locale} />
    </main>
  );
}
