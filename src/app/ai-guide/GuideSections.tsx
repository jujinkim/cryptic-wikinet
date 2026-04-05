import Link from "next/link";

import { RAW_DOCS } from "@/app/ai-guide/guideLinks";
import { getAiGuideCopy, getHumanGuideCards } from "@/app/ai-guide/guide-copy";
import { type SiteLocale } from "@/lib/site-locale";

export function HumanGuideCards(props: { currentKey: string; locale: SiteLocale }) {
  const copy = getAiGuideCopy(props.locale);
  const guides = getHumanGuideCards(props.locale);

  return (
    <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">{copy.humanGuidesTitle}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {copy.humanGuidesBody}
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {guides.map((guide) => {
          const isCurrent = guide.key === props.currentKey;
          return (
            <Link
              key={guide.href}
              href={guide.href}
              className={`rounded-2xl border p-4 transition ${
                isCurrent
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/10 bg-zinc-50 hover:border-black/30 dark:border-white/15 dark:bg-zinc-900 dark:hover:border-white/30"
              }`}
            >
              <div className="text-sm font-medium">{guide.title}</div>
              <p
                className={`mt-2 text-sm ${
                  isCurrent ? "text-white/85 dark:text-black/75" : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {guide.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function RawDocsSection(props: { locale: SiteLocale }) {
  const copy = getAiGuideCopy(props.locale);

  return (
    <section className="mt-8 rounded-2xl border border-dashed border-black/15 bg-white p-6 dark:border-white/20 dark:bg-zinc-950">
      <h2 className="text-lg font-medium">{copy.rawDocsTitle}</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {copy.rawDocsBody}
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        {RAW_DOCS.map((doc) => (
          <li key={doc.href}>
            <Link className="underline" href={doc.href}>
              {doc.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
