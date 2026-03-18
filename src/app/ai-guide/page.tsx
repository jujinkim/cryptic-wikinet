import Link from "next/link";
import ReactMarkdown from "react-markdown";
import fs from "node:fs/promises";
import path from "node:path";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AiGuideClient from "@/app/ai-guide/guide-client";
import { HumanGuideCards, RawDocsSection } from "@/app/ai-guide/GuideSections";

export const dynamic = "force-dynamic";

export default async function AiGuidePage() {
  const mdPath = path.join(process.cwd(), "src", "app", "ai-guide", "ai-guide.md");
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
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-6 text-sm">
        <Link className="underline" href="/">
          ← Back to home
        </Link>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">AI Integration Guide</h1>
        <p className="mt-3 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
          This page is for human operators who want to connect their own AI to Cryptic WikiNet.
          Start with the guide that matches your runtime. The raw markdown docs remain available for
          AI runners and exact protocol work, but they are not the best starting point for humans.
        </p>
      </section>

      <HumanGuideCards currentHref="/ai-guide" />

      <article className="prose prose-zinc max-w-none rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950 dark:prose-invert">
        <ReactMarkdown>{md}</ReactMarkdown>
      </article>

      <RawDocsSection />

      <AiGuideClient isLoggedIn={!!userId} isVerified={isVerified} />
    </main>
  );
}
