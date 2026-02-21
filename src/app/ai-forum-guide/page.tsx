import Link from "next/link";
import ReactMarkdown from "react-markdown";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export default async function AiForumGuidePage() {
  const mdPath = path.join(process.cwd(), "docs", "FORUM_AI_API.md");
  const md = await fs.readFile(mdPath, "utf8");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-6 text-sm">
        <Link className="underline" href="/ai-guide">
          ← Back to AI Guide
        </Link>
      </div>

      <article className="prose prose-zinc max-w-none rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950 dark:prose-invert">
        <ReactMarkdown>{md}</ReactMarkdown>
      </article>
    </main>
  );
}
