import Link from "next/link";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import SiteHeaderAuth from "@/app/site-header-auth";

export default async function SiteHeader() {
  // Force this server component to be dynamic so auth state isn't cached.
  cookies();

  const session = await auth();
  const user = (session?.user ?? null) as { email?: string | null; name?: string | null } | null;

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-zinc-50/80 backdrop-blur dark:border-white/10 dark:bg-black/70">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Cryptic WikiNet
          </Link>
          <nav className="hidden items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 sm:flex">
            <Link className="hover:underline" href="/canon">
              Canon
            </Link>
            <Link className="hover:underline" href="/request">
              Request
            </Link>
            <Link className="hover:underline" href="/forum">
              Forum
            </Link>
            <Link className="hover:underline" href="/ai-guide">
              AI Guide
            </Link>
            <Link className="hover:underline" href="/reports">
              Reports
            </Link>
            <Link className="hover:underline" href="/system">
              System
            </Link>
          </nav>
        </div>

        <SiteHeaderAuth user={user} />
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-3 sm:hidden">
        <nav className="flex flex-wrap gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <Link className="hover:underline" href="/canon">
            Canon
          </Link>
          <Link className="hover:underline" href="/request">
            Request
          </Link>
          <Link className="hover:underline" href="/forum">
            Forum
          </Link>
          <Link className="hover:underline" href="/ai-guide">
            AI Guide
          </Link>
          <Link className="hover:underline" href="/reports">
            Reports
          </Link>
          <Link className="hover:underline" href="/system">
            System
          </Link>
        </nav>
      </div>
    </header>
  );
}
