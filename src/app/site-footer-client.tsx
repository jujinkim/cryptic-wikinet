"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import SiteHeaderTimeZone from "@/app/site-header-time-zone";
import { openCookieConsentSettings } from "@/lib/cookie-consent";
import { getLegalDocumentTitle } from "@/lib/legalDocuments";
import { getSiteCopy } from "@/lib/site-copy";
import { getLocaleFromPathname, stripLocalePrefix, withSiteLocale } from "@/lib/site-locale";

function getWikiLicenseCopy(locale: "en" | "ko" | "ja") {
  switch (locale) {
    case "ko":
      return {
        note: "별도 표시가 없는 한, 위키 콘텐츠에는 CC BY 4.0이 적용됩니다. 사이트 브랜드와 소프트웨어는 제외됩니다.",
        alt: "CC BY 4.0 라이선스",
      };
    case "ja":
      return {
        note: "別段の表示がない限り、Wikiコンテンツには CC BY 4.0 が適用されます。サイトのブランドおよびソフトウェアは含まれません。",
        alt: "CC BY 4.0 ライセンス",
      };
    default:
      return {
        note: "Unless noted otherwise, wiki content is available under CC BY 4.0. Site branding and software are excluded.",
        alt: "CC BY 4.0 license",
      };
  }
}

export default function SiteFooterClient(props: {
  donateUrl: string | null;
  bmcButtonImageUrl: string | null;
  year: number;
}) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const normalizedPath = stripLocalePrefix(pathname).pathname;
  const copy = getSiteCopy(locale);
  const wikiLicense = getWikiLicenseCopy(locale);
  const homeHref = withSiteLocale("/", locale);
  const catalogHref = withSiteLocale("/catalog", locale);
  const requestHref = withSiteLocale("/request", locale);
  const forumHref = withSiteLocale("/forum", locale);
  const reportsHref = withSiteLocale("/reports", locale);
  const privacyHref = withSiteLocale("/privacy", locale);
  const termsHref = withSiteLocale("/terms", locale);
  const docLinks = [
    { href: withSiteLocale("/about", locale), label: copy.nav.about },
    { href: withSiteLocale("/canon", locale), label: copy.nav.canon },
    { href: withSiteLocale("/ai-guide", locale), label: copy.nav.aiGuide },
  ] as const;
  const docsActive =
    normalizedPath === "/about" ||
    normalizedPath.startsWith("/about/") ||
    normalizedPath === "/canon" ||
    normalizedPath === "/system" ||
    normalizedPath.startsWith("/system/") ||
    normalizedPath === "/rewards" ||
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
              <Link className="hover:underline" href={privacyHref}>
                {getLegalDocumentTitle("privacy", locale)}
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href={termsHref}>
                {getLegalDocumentTitle("terms", locale)}
              </Link>
            </li>
            <li>
              <button type="button" className="hover:underline" onClick={openCookieConsentSettings}>
                {copy.cookieNotice.settings}
              </button>
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
          <a
            className="inline-flex items-center gap-3 rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-left transition hover:bg-white dark:border-white/15 dark:bg-zinc-950/70 dark:hover:bg-zinc-950"
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="license noreferrer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cc-by-4.0.svg"
              alt={wikiLicense.alt}
              className="h-8 w-auto shrink-0"
              loading="lazy"
            />
            <span className="text-[11px] leading-5 text-zinc-500/90">{wikiLicense.note}</span>
          </a>
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
