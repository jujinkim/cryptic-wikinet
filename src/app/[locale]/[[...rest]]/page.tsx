import { notFound, redirect } from "next/navigation";

import { canFallbackToDefaultLocalePath } from "@/lib/locale-fallback";
import { isSupportedSiteLocale } from "@/lib/site-locale";

function normalizeFallbackPath(rest: string[] | undefined) {
  if (!rest || rest.length === 0) return "/";
  return `/${rest.join("/")}`;
}

export default async function LocalizedFallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; rest?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, rest } = await params;
  if (!isSupportedSiteLocale(locale) || locale === "en") notFound();

  const pathname = normalizeFallbackPath(rest);
  if (!canFallbackToDefaultLocalePath(pathname)) notFound();

  const sp = await searchParams;
  const nextSearch = new URLSearchParams();

  for (const [key, value] of Object.entries(sp)) {
    if (key === "flash" || key === "fromLocale") continue;
    if (typeof value === "string") {
      nextSearch.set(key, value);
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => nextSearch.append(key, item));
    }
  }

  nextSearch.set("flash", "missing-locale-page");
  nextSearch.set("fromLocale", locale);

  redirect(`${pathname}${nextSearch.size > 0 ? `?${nextSearch.toString()}` : ""}`);
}

