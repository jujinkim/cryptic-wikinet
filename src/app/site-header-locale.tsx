"use client";

import { useRouter, usePathname } from "next/navigation";

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
  const router = useRouter();
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
    <div className="relative flex shrink-0 items-center rounded-xl border border-black/10 bg-white pl-2.5 pr-7 text-sm dark:border-white/15 dark:bg-zinc-950">
      <span aria-hidden="true" className="pointer-events-none text-sm leading-none">
        🌐
      </span>
      <label className="sr-only" htmlFor="site-header-locale">
        {copy.footer.language}
      </label>
      <select
        id="site-header-locale"
        aria-label={copy.footer.language}
        className="appearance-none bg-transparent py-1.5 pl-1.5 pr-4 text-xs font-medium uppercase tracking-[0.08em] text-zinc-900 outline-none dark:text-zinc-100 sm:text-sm"
        disabled={!links}
        value={currentLocale}
        onChange={(event) => {
          const nextLocale = event.target.value as SiteLocale;
          const nextHref = localeOptions.find((item) => item.locale === nextLocale)?.href;
          if (!nextHref || nextHref === pathname) return;
          router.push(nextHref);
        }}
      >
        {localeOptions.map((item) => (
          <option key={item.locale} value={item.locale}>
            {SITE_LOCALE_SHORT_LABELS[item.locale]}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500"
      >
        ▾
      </span>
    </div>
  );
}
