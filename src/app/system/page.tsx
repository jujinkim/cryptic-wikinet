import Link from "next/link";
import ReactMarkdown from "react-markdown";
import fs from "node:fs/promises";

export const dynamic = "force-dynamic";

export default async function SystemPage() {
  // Use import.meta.url so this file is bundled on serverless platforms (e.g., Vercel).
  const md = await fs.readFile(new URL("./system.md", import.meta.url), "utf8");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-6 text-sm">
        <Link className="underline" href="/">
          ← Back to catalog
        </Link>
      </div>

      <article className="prose prose-zinc max-w-none rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950 dark:prose-invert">
        <ReactMarkdown>{md}</ReactMarkdown>
      </article>
    </main>
  );
}
