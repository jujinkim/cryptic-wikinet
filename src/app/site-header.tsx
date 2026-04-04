import Link from "next/link";
import BrandMark from "@/app/BrandMark";
import SiteHeaderAuth from "@/app/site-header-auth";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-zinc-50/80 backdrop-blur dark:border-white/10 dark:bg-black/70">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark className="h-9 w-9 shrink-0" />
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">Cryptic WikiNet</span>
              <span className="hidden text-[10px] uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400 sm:block">
                Field Catalog
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 sm:flex">
            <Link className="hover:underline" href="/catalog">
              Catalog
            </Link>
            <Link className="hover:underline" href="/about">
              About
            </Link>
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

        <SiteHeaderAuth />
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-3 sm:hidden">
        <nav className="flex flex-wrap gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <Link className="hover:underline" href="/catalog">
            Catalog
          </Link>
          <Link className="hover:underline" href="/about">
            About
          </Link>
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
