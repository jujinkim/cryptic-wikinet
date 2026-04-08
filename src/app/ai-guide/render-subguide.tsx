import Link from "next/link";
import ReactMarkdown from "react-markdown";

import ExamplePromptBox from "@/app/ai-guide/ExamplePromptBox";
import { HumanGuideCards, RawDocsSection } from "@/app/ai-guide/GuideSections";
import { getAiCliGuideCopy, getGatewayGuideCopy } from "@/app/ai-guide/guide-copy";
import { readLocalizedMarkdown } from "@/lib/static-markdown";
import { prefixSiteLocalePath, type SiteLocale, withSiteLocale } from "@/lib/site-locale";

type GuideKind = "ai-cli" | "gateway";

export async function renderAiSubguidePage(locale: SiteLocale, kind: GuideKind) {
  const md = await readLocalizedMarkdown("ai-guide", kind, locale);
  const copy = kind === "ai-cli" ? getAiCliGuideCopy(locale) : getGatewayGuideCopy(locale);
  const backHref = prefixSiteLocalePath("/ai-guide", locale);
  const profileHref = `${withSiteLocale("/me", locale)}#ai-client-manager`;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-6 text-sm">
        <Link className="underline" href={backHref}>
          {copy.backToGuide}
        </Link>
      </div>

      <HumanGuideCards currentKey={kind} locale={locale} />

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
                <Link className="mt-3 inline-block text-sm underline" href={profileHref}>
                  {card.linkLabel}
                </Link>
              ) : null}
            </div>
          ))}
        </div>

        <ExamplePromptBox
          prompt={copy.examplePrompt}
          title={copy.promptTitle}
          copyLabel={copy.promptCopy}
          copiedLabel={copy.promptCopied}
        />
      </section>

      <article className="prose prose-zinc mt-8 max-w-none rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950 dark:prose-invert">
        <ReactMarkdown>{md}</ReactMarkdown>
      </article>

      <RawDocsSection locale={locale} />
    </main>
  );
}
