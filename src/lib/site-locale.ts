export const SUPPORTED_SITE_LOCALES = ["en", "ko", "ja"] as const;

export type SiteLocale = (typeof SUPPORTED_SITE_LOCALES)[number];

export const DEFAULT_SITE_LOCALE: SiteLocale = "en";

const LOCALIZED_STATIC_EXACT_PATHS = new Set([
  "/about",
  "/canon",
  "/system",
  "/ai-guide",
  "/ai-guide/easy-start",
  "/ai-guide/ai-cli",
  "/ai-guide/gateway",
]);

const LOCALE_ENABLED_EXACT_PATHS = new Set([
  "/",
  ...LOCALIZED_STATIC_EXACT_PATHS,
  "/ai-guide/cli-agent",
  "/ai-guide/openclaw",
  "/catalog",
  "/forum",
  "/forum/new",
  "/request",
  "/reports",
  "/login",
  "/signup",
  "/verify",
  "/cancel",
  "/me",
  "/settings/account",
  "/settings/profile",
  "/admin/reports",
  "/admin/tags",
]);

const LOCALE_ENABLED_PATTERNS = [
  /^\/forum\/[^/]+$/,
  /^\/members\/[^/]+$/,
  /^\/wiki\/[^/]+$/,
  /^\/wiki\/[^/]+\/(?:history|diff)$/,
] as const;

function normalizeSitePathname(pathname: string | null | undefined) {
  const raw = pathname && pathname.startsWith("/") ? pathname : `/${pathname ?? ""}`;
  if (raw === "/") return "/";
  return raw.replace(/\/+$/, "") || "/";
}

export function isSupportedSiteLocale(value: string): value is SiteLocale {
  return (SUPPORTED_SITE_LOCALES as readonly string[]).includes(value);
}

export function resolveSiteLocale(value: string | null | undefined): SiteLocale {
  if (value && isSupportedSiteLocale(value)) return value;
  return DEFAULT_SITE_LOCALE;
}

export function stripLocalePrefix(pathname: string | null | undefined) {
  const raw = normalizeSitePathname(pathname);
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

export function isLocaleEnabledPath(pathname: string | null | undefined) {
  const normalized = stripLocalePrefix(pathname).pathname;
  if (LOCALE_ENABLED_EXACT_PATHS.has(normalized)) return true;
  return LOCALE_ENABLED_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function withSiteLocale(pathname: string, locale: SiteLocale) {
  const normalized = normalizeSitePathname(pathname);
  if (!isLocaleEnabledPath(normalized) || locale === DEFAULT_SITE_LOCALE) {
    return normalized;
  }
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

export function prefixSiteLocalePath(pathname: string, locale: SiteLocale) {
  const normalized = normalizeSitePathname(pathname);
  if (locale === DEFAULT_SITE_LOCALE) return normalized;
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

export function getLanguageLinks(pathname: string | null | undefined) {
  const normalized = stripLocalePrefix(pathname).pathname;
  if (!isLocaleEnabledPath(normalized)) return null;

  return SUPPORTED_SITE_LOCALES.map((locale) => ({
    locale,
    href: withSiteLocale(normalized, locale),
  }));
}
