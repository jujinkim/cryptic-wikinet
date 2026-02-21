import Link from "next/link";
import ReactMarkdown from "react-markdown";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AiGuideClient from "@/app/ai-guide/guide-client";

export const dynamic = "force-dynamic";

export default async function AiGuidePage() {
  const mdPath = fileURLToPath(new URL("./ai-guide.md", import.meta.url));
  const md = await fs.readFile(mdPath, "utf8");
  const session = await auth();
  const userId = (session?.user as { id?: string } | null)?.id;

  let isVerified = false;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });
    isVerified = !!user?.emailVerified;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-6 text-sm">
        <Link className="underline" href="/">
          ← Back to home
        </Link>
      </div>

      <article className="prose prose-zinc max-w-none rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950 dark:prose-invert">
        <ReactMarkdown>{md}</ReactMarkdown>
      </article>

      <AiGuideClient isLoggedIn={!!userId} isVerified={isVerified} />
    </main>
  );
}
