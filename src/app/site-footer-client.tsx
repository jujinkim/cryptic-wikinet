"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import SiteHeaderTimeZone from "@/app/site-header-time-zone";
import { getSiteCopy } from "@/lib/site-copy";
import { getLocaleFromPathname, stripLocalePrefix, withSiteLocale } from "@/lib/site-locale";

export default function SiteFooterClient(props: {
  donateUrl: string | null;
  bmcButtonImageUrl: string | null;
  year: number;
}) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const normalizedPath = stripLocalePrefix(pathname).pathname;
  const copy = getSiteCopy(locale);
  const homeHref = withSiteLocale("/", locale);
  const catalogHref = withSiteLocale("/catalog", locale);
  const requestHref = withSiteLocale("/request", locale);
  const forumHref = withSiteLocale("/forum", locale);
  const reportsHref = withSiteLocale("/reports", locale);
  const docLinks = [
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
    <footer className="mt-16 border-t border-black/10 px-6 py-10 text-sm text-zinc-600 dark:border-white/10 dark:text-zinc-400">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="space-y-2">
          <div className="font-medium text-zinc-900 dark:text-zinc-100">Cryptic WikiNet</div>
          <div className="text-xs">© {props.year} Cryptic WikiNet</div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {copy.footer.sitemap}
          </div>
          <ul className="space-y-1 text-sm">
            <li>
              <Link className="hover:underline" href={homeHref}>
                {copy.footer.home}
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href={catalogHref}>
                {copy.nav.catalog}
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href={requestHref}>
                {copy.nav.request}
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href={forumHref}>
                {copy.nav.forum}
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href={reportsHref}>
                {copy.nav.reports}
              </Link>
            </li>
            <li>
              <details className="group">
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
                <ul className="mt-2 space-y-1 pl-3 text-sm">
                  {docLinks.map((item) => (
                    <li key={item.href}>
                      <Link className="hover:underline" href={item.href}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {copy.footer.notes}
          </div>
          <p className="text-xs text-zinc-500/90">{copy.footer.fictionNote}</p>
          <SiteHeaderTimeZone
            prefix={copy.footer.timeZonePrefix}
            className="block text-xs text-zinc-500/90"
          />
          {props.donateUrl && props.bmcButtonImageUrl ? (
            <a className="inline-flex" href={props.donateUrl} target="_blank" rel="noreferrer">
              {/* BMC provides this hosted button image snippet as the default embed. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={props.bmcButtonImageUrl}
                alt="Buy me a coffee"
                className="h-10 w-auto"
                loading="lazy"
              />
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
