"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getSiteCopy } from "@/lib/site-copy";
import {
  SUPPORTED_SITE_LOCALES,
  getLanguageLinks,
  getLocaleFromPathname,
  type SiteLocale,
} from "@/lib/site-locale";

const SITE_LOCALE_SHORT_LABELS: Record<SiteLocale, string> = {
  en: "EN",
  ko: "KO",
  ja: "JA",
};

export default function SiteHeaderLocale() {
  const pathname = usePathname();
  const currentLocale = getLocaleFromPathname(pathname);
  const copy = getSiteCopy(currentLocale);
  const links = getLanguageLinks(pathname);
  const localeOptions =
    links?.map((item) => ({ locale: item.locale, href: item.href })) ??
    SUPPORTED_SITE_LOCALES.map((locale) => ({
      locale,
      href: pathname ?? "/",
    }));

  return (
    <details className="group relative shrink-0">
      <summary
        className="flex cursor-pointer list-none items-center gap-1 rounded-xl border border-black/10 bg-white px-2 py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-900 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100 sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-sm sm:tracking-[0.08em]"
        data-testid="site-header-locale-trigger"
      >
        <span>{SITE_LOCALE_SHORT_LABELS[currentLocale]}</span>
        <span aria-hidden="true" className="text-[10px] text-zinc-500 transition group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-32 rounded-2xl border border-black/10 bg-white p-2 shadow-lg dark:border-white/15 dark:bg-zinc-950">
        <div className="mb-1 px-2 pt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
          {copy.footer.language}
        </div>
        <div className="flex flex-col gap-1">
          {localeOptions.map((item) => {
            const active = item.locale === currentLocale;
            return (
              <Link
                key={item.locale}
                href={item.href}
                className={`rounded-xl px-3 py-2 text-sm transition ${
                  active
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                {copy.languages[item.locale]}
              </Link>
            );
          })}
        </div>
      </div>
    </details>
  );
}
