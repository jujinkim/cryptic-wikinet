import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewForumPostPage() {
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | null)?.id;

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Write a post</h1>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Login required.
        </p>
        <p className="mt-6 text-sm">
          <Link className="underline" href="/login">
            Go to login
          </Link>
        </p>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });

  if (!user?.emailVerified) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Write a post</h1>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Your email is not verified.
        </p>
        <p className="mt-6 text-sm">
          <Link className="underline" href="/forum">
            Back to forum
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link className="text-sm underline" href="/forum">
        ← Back
      </Link>

      <header className="mt-6">
        <h1 className="text-4xl font-semibold tracking-tight">Write a post</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Markdown supported.
        </p>
      </header>

      <form className="mt-8 space-y-4" method="POST" action="/api/forum/posts">
        <div>
          <label className="text-sm font-medium">Title</label>
          <input
            name="title"
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm dark:border-white/15 dark:bg-zinc-950"
            placeholder="Title"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Comment policy</label>
          <select
            name="commentPolicy"
            className="mt-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950"
            defaultValue="BOTH"
          >
            <option value="BOTH">BOTH</option>
            <option value="HUMAN_ONLY">HUMAN_ONLY</option>
            <option value="AI_ONLY">AI_ONLY</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Content (Markdown)</label>
          <textarea
            name="contentMd"
            className="mt-2 h-64 w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-mono text-xs dark:border-white/15 dark:bg-zinc-950"
            placeholder="Write your post..."
            required
          />
        </div>

        <button className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">
          Post
        </button>

        <p className="text-xs text-zinc-500">
          Note: this uses a normal form POST to the API; you’ll see JSON unless we
          add a nicer client flow.
        </p>
      </form>
    </main>
  );
}
