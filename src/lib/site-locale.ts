export const SUPPORTED_SITE_LOCALES = ["en", "ko", "ja"] as const;

export type SiteLocale = (typeof SUPPORTED_SITE_LOCALES)[number];

export const DEFAULT_SITE_LOCALE: SiteLocale = "en";

const LOCALIZED_STATIC_EXACT_PATHS = new Set([
  "/about",
  "/canon",
  "/system",
  "/ai-guide",
  "/ai-guide/ai-cli",
  "/ai-guide/gateway",
]);

export function isSupportedSiteLocale(value: string): value is SiteLocale {
  return (SUPPORTED_SITE_LOCALES as readonly string[]).includes(value);
}

export function resolveSiteLocale(value: string | null | undefined): SiteLocale {
  if (value && isSupportedSiteLocale(value)) return value;
  return DEFAULT_SITE_LOCALE;
}

export function stripLocalePrefix(pathname: string | null | undefined) {
  const raw = pathname && pathname.startsWith("/") ? pathname : `/${pathname ?? ""}`;
  const parts = raw.split("/");
  const maybeLocale = parts[1] ?? "";

  if (!isSupportedSiteLocale(maybeLocale)) {
    return {
      locale: DEFAULT_SITE_LOCALE,
      pathname: raw,
      hasLocalePrefix: false,
    };
  }

  const nextPath = `/${parts.slice(2).join("/")}`.replace(/\/+/g, "/");
  return {
    locale: maybeLocale,
    pathname: nextPath === "/" ? "/" : nextPath.replace(/\/$/, "") || "/",
    hasLocalePrefix: true,
  };
}

export function getLocaleFromPathname(pathname: string | null | undefined): SiteLocale {
  return stripLocalePrefix(pathname).locale;
}

export function isLocalizedStaticPath(pathname: string | null | undefined) {
  return LOCALIZED_STATIC_EXACT_PATHS.has(stripLocalePrefix(pathname).pathname);
}

export function withSiteLocale(pathname: string, locale: SiteLocale) {
  if (!LOCALIZED_STATIC_EXACT_PATHS.has(pathname) || locale === DEFAULT_SITE_LOCALE) {
    return pathname;
  }
  return `/${locale}${pathname}`;
}

export function prefixSiteLocalePath(pathname: string, locale: SiteLocale) {
  if (locale === DEFAULT_SITE_LOCALE) return pathname;
  return `/${locale}${pathname}`;
}

export function getStaticLanguageLinks(pathname: string | null | undefined) {
  const normalized = stripLocalePrefix(pathname).pathname;
  if (!LOCALIZED_STATIC_EXACT_PATHS.has(normalized)) return null;

  return SUPPORTED_SITE_LOCALES.map((locale) => ({
    locale,
    href: withSiteLocale(normalized, locale),
  }));
}
