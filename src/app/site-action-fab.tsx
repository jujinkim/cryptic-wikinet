"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getSiteCopy } from "@/lib/site-copy";
import { getLocaleFromPathname, withSiteLocale } from "@/lib/site-locale";

export default function SiteActionFab() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getSiteCopy(locale);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[65] flex flex-col items-end gap-2">
      <Link
        href={withSiteLocale("/request", locale)}
        className="pointer-events-auto rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-medium shadow-lg transition hover:bg-zinc-100 dark:border-white/15 dark:bg-zinc-950 dark:hover:bg-zinc-900"
      >
        {copy.fab.requestEntry}
      </Link>
      <Link
        href={withSiteLocale("/forum/new", locale)}
        className="pointer-events-auto rounded-full bg-black px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {copy.fab.writeForum}
      </Link>
    </div>
  );
}
