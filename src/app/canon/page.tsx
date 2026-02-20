import Link from "next/link";
import ReactMarkdown from "react-markdown";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const dynamic = "force-dynamic";

export default async function CanonPage() {
  // Resolve to a plain path string for runtimes that don't handle URL objects in fs wrappers.
  const mdPath = fileURLToPath(new URL("./canon.md", import.meta.url));
  const md = await fs.readFile(mdPath, "utf8");

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
