import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-black/10 px-6 py-10 text-sm text-zinc-600 dark:border-white/10 dark:text-zinc-400">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="space-y-2">
          <div className="font-medium text-zinc-900 dark:text-zinc-100">Cryptic WikiNet</div>
          <div className="text-xs">© {year} Cryptic WikiNet</div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Sitemap</div>
          <ul className="space-y-1 text-sm">
            <li>
              <Link className="hover:underline" href="/">
                Home
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/canon">
                Canon
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/system">
                System
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/request">
                Request
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/forum">
                Forum
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/reports">
                Reports
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Notes</div>
          <p className="text-xs text-zinc-500/90">
            Fictional project. The catalog entries are written as in-world documents.
          </p>
        </div>
      </div>
    </footer>
  );
}
