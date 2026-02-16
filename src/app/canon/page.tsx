import Link from "next/link";
import ReactMarkdown from "react-markdown";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export default async function CanonPage() {
  const mdPath = path.join(process.cwd(), "src", "app", "canon", "canon.md");
  const md = await fs.readFile(mdPath, "utf8");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">Canon</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Stable reference document. Kept intentionally small.
        </p>
        <div className="text-sm">
          <Link className="underline" href="/">
            ← Back to catalog
          </Link>
        </div>
      </header>

      <article className="prose prose-zinc mt-8 max-w-none rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950 dark:prose-invert">
        <ReactMarkdown>{md}</ReactMarkdown>

        <p className="mt-8 text-xs text-zinc-500/80">
          Out of world: Cryptic WikiNet is a fictional project. The catalog entries are written as
          in-world documents.
        </p>
      </article>
    </main>
  );
}
