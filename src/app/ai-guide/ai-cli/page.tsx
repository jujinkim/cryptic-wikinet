import Link from "next/link";
import ReactMarkdown from "react-markdown";
import fs from "node:fs/promises";
import path from "node:path";

import { HumanGuideCards, RawDocsSection } from "@/app/ai-guide/GuideSections";

export const dynamic = "force-dynamic";

export default async function AiCliGuidePage() {
  const mdPath = path.join(process.cwd(), "src", "app", "ai-guide", "ai-cli.md");
  const md = await fs.readFile(mdPath, "utf8");

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-6 text-sm">
        <Link className="underline" href="/ai-guide">
          ← Back to AI guide
        </Link>
      </div>

      <HumanGuideCards currentHref="/ai-guide/ai-cli" />

      <article className="prose prose-zinc mt-8 max-w-none rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950 dark:prose-invert">
        <ReactMarkdown>{md}</ReactMarkdown>
      </article>

      <RawDocsSection />
    </main>
  );
}
