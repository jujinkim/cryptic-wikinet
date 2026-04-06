"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import BrandMark from "@/app/BrandMark";
import SiteHeaderAuth from "@/app/site-header-auth";
import SiteHeaderLocale from "@/app/site-header-locale";
import SiteHeaderSearch from "@/app/site-header-search";
import { getSiteCopy } from "@/lib/site-copy";
import { getLocaleFromPathname, stripLocalePrefix, withSiteLocale } from "@/lib/site-locale";

export default function SiteHeader() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const normalizedPath = stripLocalePrefix(pathname).pathname;
  const copy = getSiteCopy(locale);
  const homeHref = withSiteLocale("/", locale);
  const primaryNavItems = [
    { href: withSiteLocale("/catalog", locale), label: copy.nav.catalog },
    { href: withSiteLocale("/request", locale), label: copy.nav.request },
    { href: withSiteLocale("/forum", locale), label: copy.nav.forum },
    { href: withSiteLocale("/reports", locale), label: copy.nav.reports },
  ] as const;
  const docNavItems = [
    { href: withSiteLocale("/about", locale), label: copy.nav.about },
    { href: withSiteLocale("/canon", locale), label: copy.nav.canon },
    { href: withSiteLocale("/ai-guide", locale), label: copy.nav.aiGuide },
    { href: withSiteLocale("/system", locale), label: copy.nav.system },
  ] as const;
  const docsActive =
    normalizedPath === "/about" ||
    normalizedPath === "/canon" ||
    normalizedPath === "/system" ||
    normalizedPath.startsWith("/ai-guide");

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
              {primaryNavItems.map((item) => (
                <Link key={item.href} className="hover:underline" href={item.href}>
                  {item.label}
                </Link>
              ))}
              <details className="group relative">
                <summary
                  className={`flex cursor-pointer list-none items-center gap-1 ${
                    docsActive ? "text-zinc-900 dark:text-zinc-100" : "hover:underline"
                  }`}
                >
                  <span>{copy.nav.docs}</span>
                  <span aria-hidden="true" className="text-[10px] text-zinc-500 transition group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 min-w-40 rounded-2xl border border-black/10 bg-white p-2 text-sm shadow-lg dark:border-white/15 dark:bg-zinc-950">
                  <div className="flex flex-col gap-1">
                    {docNavItems.map((item) => (
                      <Link
                        key={item.href}
                        className="rounded-xl px-3 py-2 text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        href={item.href}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </details>
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
            {primaryNavItems.map((item) => (
              <Link key={item.href} className="hover:underline" href={item.href}>
                {item.label}
              </Link>
            ))}
            <details className="group basis-full">
              <summary className="flex cursor-pointer list-none items-center gap-1 hover:underline">
                <span>{copy.nav.docs}</span>
                <span aria-hidden="true" className="text-[10px] text-zinc-500 transition group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <div className="mt-2 flex flex-wrap gap-3 pl-1">
                {docNavItems.map((item) => (
                  <Link key={item.href} className="hover:underline" href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
          </nav>
        </div>
      </div>
    </header>
  );
}
