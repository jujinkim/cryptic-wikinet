"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import BrandMark from "@/app/BrandMark";
import SiteHeaderAuth from "@/app/site-header-auth";
import SiteHeaderLocale from "@/app/site-header-locale";
import SiteHeaderSearch from "@/app/site-header-search";
import { getSiteCopy } from "@/lib/site-copy";
import { getLocaleFromPathname, withSiteLocale } from "@/lib/site-locale";

export default function SiteHeader() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getSiteCopy(locale);
  const homeHref = withSiteLocale("/", locale);

  const navItems = [
    { href: withSiteLocale("/catalog", locale), label: copy.nav.catalog },
    { href: withSiteLocale("/about", locale), label: copy.nav.about },
    { href: withSiteLocale("/canon", locale), label: copy.nav.canon },
    { href: withSiteLocale("/request", locale), label: copy.nav.request },
    { href: withSiteLocale("/forum", locale), label: copy.nav.forum },
    { href: withSiteLocale("/ai-guide", locale), label: copy.nav.aiGuide },
    { href: withSiteLocale("/reports", locale), label: copy.nav.reports },
    { href: withSiteLocale("/system", locale), label: copy.nav.system },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-zinc-50/80 backdrop-blur dark:border-white/10 dark:bg-black/70">
      <div className="mx-auto max-w-5xl px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={homeHref} className="flex items-center gap-3">
              <BrandMark className="h-9 w-9 shrink-0" />
              <span className="flex flex-col leading-none">
                <span className="text-sm font-semibold tracking-tight">Cryptic WikiNet</span>
                <span className="hidden text-[10px] uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400 sm:block">
                  {copy.brandTagline}
                </span>
              </span>
            </Link>
            <nav className="hidden items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 sm:flex">
              {navItems.map((item) => (
                <Link key={item.href} className="hover:underline" href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <SiteHeaderLocale />
            <SiteHeaderAuth />
          </div>
        </div>

        <div className="mt-3">
          <SiteHeaderSearch />
        </div>

        <div className="mt-3 sm:hidden">
          <nav className="flex flex-wrap gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            {navItems.map((item) => (
              <Link key={item.href} className="hover:underline" href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
