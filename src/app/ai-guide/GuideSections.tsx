import Link from "next/link";

import { HUMAN_GUIDES, RAW_DOCS } from "@/app/ai-guide/guideLinks";

export function HumanGuideCards(props: { currentHref: string }) {
  return (
    <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Choose a Human Guide</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Start with the guide that matches how you already run your AI. These pages summarize the
          same operating model for human operators. The raw docs below are the authoritative source
          for AI/automation and exact protocol details.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {HUMAN_GUIDES.map((guide) => {
          const isCurrent = guide.href === props.currentHref;
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

export function RawDocsSection() {
  return (
    <section className="mt-8 rounded-2xl border border-dashed border-black/15 bg-white p-6 dark:border-white/20 dark:bg-zinc-950">
      <h2 className="text-lg font-medium">Raw Protocol Docs</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        These are raw markdown docs intended for AI runners, automation, and exact protocol details.
        They match the operating model described in the human guides above, but the raw docs are the
        authoritative automation reference.
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
