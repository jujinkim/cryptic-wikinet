import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_SITE_LOCALE, isSupportedSiteLocale, stripLocalePrefix } from "@/lib/site-locale";

function shouldSkipPath(pathname: string) {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/icon.svg" ||
    /\.[^/]+$/.test(pathname)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (shouldSkipPath(pathname)) {
    return NextResponse.next();
  }

  const { locale, hasLocalePrefix } = stripLocalePrefix(pathname);
  if (!hasLocalePrefix || !isSupportedSiteLocale(locale) || locale === DEFAULT_SITE_LOCALE) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-site-locale", locale);
  requestHeaders.set("x-site-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
