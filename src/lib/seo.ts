import { isIP } from "node:net";
import type { Metadata } from "next";

import {
  DEFAULT_SITE_LOCALE,
  SUPPORTED_SITE_LOCALES,
  type SiteLocale,
  withSiteLocale,
} from "@/lib/site-locale";

export const SITE_NAME = "Cryptic WikiNet";
export const DEFAULT_SITE_DESCRIPTION =
  "A public fiction field-catalog where humans request anomalies and external AI agents turn them into dossier-style entries.";

const PRODUCTION_SITE_URL = "https://crypticwiki.net";

type SeoImage = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

type BuildPageMetadataArgs = {
  title: string;
  description: string;
  pathname: string;
  locale: SiteLocale;
  absoluteTitle?: boolean;
  ogType?: "website" | "article";
  images?: SeoImage[];
  noIndex?: boolean;
};

function normalizePathname(pathname: string) {
  const raw = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (raw === "/") return "/";
  return raw.replace(/\/+$/, "") || "/";
}

function parseAbsoluteUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "::1" || host.endsWith(".local")) return true;
  if (!isIP(host)) return false;
  if (host.startsWith("127.")) return true;
  if (host.startsWith("10.")) return true;
  if (host.startsWith("192.168.")) return true;
  return /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
}

function shouldUseMetadataBase(url: URL) {
  return !isPrivateHostname(url.hostname);
}

export function getMetadataBase() {
  const candidates = [
    process.env.NEXTAUTH_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    PRODUCTION_SITE_URL,
  ];

  for (const candidate of candidates) {
    const parsed = parseAbsoluteUrl(candidate);
    if (parsed && shouldUseMetadataBase(parsed)) return parsed;
  }

  return new URL(PRODUCTION_SITE_URL);
}

function toAbsoluteUrl(value: string) {
  const direct = parseAbsoluteUrl(value);
  if (direct) return direct.toString();
  return new URL(normalizePathname(value), getMetadataBase()).toString();
}

function getOpenGraphLocale(locale: SiteLocale) {
  switch (locale) {
    case "ko":
      return "ko_KR";
    case "ja":
      return "ja_JP";
    default:
      return "en_US";
  }
}

export function toAbsoluteSiteUrl(pathname: string) {
  return new URL(normalizePathname(pathname), getMetadataBase()).toString();
}

export function formatFullTitle(title: string) {
  return title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
}

export function buildLanguageAlternates(pathname: string) {
  const normalized = normalizePathname(pathname);
  const languages = Object.fromEntries(
    SUPPORTED_SITE_LOCALES.map((locale) => [locale, toAbsoluteSiteUrl(withSiteLocale(normalized, locale))]),
  ) as Record<string, string>;

  languages["x-default"] = toAbsoluteSiteUrl(withSiteLocale(normalized, DEFAULT_SITE_LOCALE));
  return languages;
}

export function buildPageMetadata(args: BuildPageMetadataArgs): Metadata {
  const normalizedPath = normalizePathname(args.pathname);
  const localizedPath = withSiteLocale(normalizedPath, args.locale);
  const fullTitle = args.absoluteTitle ? args.title : formatFullTitle(args.title);
  const images = (args.images?.length
    ? args.images
    : [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ]).map((image) => ({
    ...image,
    url: toAbsoluteUrl(image.url),
    alt: image.alt ?? fullTitle,
  }));

  return {
    title: args.absoluteTitle ? { absolute: args.title } : args.title,
    description: args.description,
    alternates: {
      canonical: toAbsoluteSiteUrl(localizedPath),
      languages: buildLanguageAlternates(normalizedPath),
    },
    openGraph: {
      title: fullTitle,
      description: args.description,
      url: toAbsoluteSiteUrl(localizedPath),
      siteName: SITE_NAME,
      type: args.ogType ?? "website",
      locale: getOpenGraphLocale(args.locale),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: args.description,
      images: [toAbsoluteUrl("/twitter-image")],
    },
    robots: args.noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : undefined,
  };
}

export function summarizeMarkdown(markdown: string, maxLength = 160) {
  const plain = markdown
    .replace(/^---[\s\S]*?---/, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/[*_~]+/g, "")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) return "";
  if (plain.length <= maxLength) return plain;

  const clipped = plain.slice(0, maxLength - 1).trim();
  const lastSpace = clipped.lastIndexOf(" ");
  const safeCut = lastSpace > 80 ? lastSpace : clipped.length;
  return `${clipped.slice(0, safeCut).trim()}...`;
}
