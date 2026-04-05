"use client";

import { useRouter, usePathname } from "next/navigation";

import { getSiteCopy } from "@/lib/site-copy";
import {
  SUPPORTED_SITE_LOCALES,
  getLanguageLinks,
  getLocaleFromPathname,
  type SiteLocale,
} from "@/lib/site-locale";

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
    <div className="flex shrink-0 items-center gap-2 text-sm">
      <span aria-hidden="true" className="text-base leading-none">
        🌐
      </span>
      <label className="sr-only" htmlFor="site-header-locale">
        {copy.footer.language}
      </label>
      <select
        id="site-header-locale"
        aria-label={copy.footer.language}
        className="w-24 rounded-xl border border-black/10 bg-white px-2 py-1.5 text-xs dark:border-white/15 dark:bg-zinc-950 sm:w-28 sm:text-sm"
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
            {copy.languages[item.locale]}
          </option>
        ))}
      </select>
    </div>
  );
}
