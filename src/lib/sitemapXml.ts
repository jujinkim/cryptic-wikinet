import { toAbsoluteSiteUrl } from "@/lib/seo";

export const SITEMAP_PAGE_SIZE = 5000;

type SitemapEntry = {
  url: string;
  lastModified?: Date;
  alternates?: Record<string, string>;
};

type SitemapIndexEntry = {
  url: string;
  lastModified?: Date;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatLastModified(value: Date | undefined) {
  return value ? value.toISOString() : null;
}

export function createSitemapXml(entries: SitemapEntry[]) {
  const hasAlternates = entries.some((entry) => entry.alternates && Object.keys(entry.alternates).length > 0);
  const xmlns = hasAlternates
    ? ' xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml"'
    : ' xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';

  const body = entries
    .map((entry) => {
      const alternates = entry.alternates
        ? Object.entries(entry.alternates)
            .map(
              ([locale, href]) =>
                `<xhtml:link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(href)}" />`,
            )
            .join("")
        : "";
      const lastModified = formatLastModified(entry.lastModified);

      return `<url><loc>${escapeXml(entry.url)}</loc>${alternates}${lastModified ? `<lastmod>${escapeXml(lastModified)}</lastmod>` : ""}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>` + `<urlset${xmlns}>${body}</urlset>`;
}

export function createSitemapIndexXml(entries: SitemapIndexEntry[]) {
  const body = entries
    .map((entry) => {
      const lastModified = formatLastModified(entry.lastModified);
      return `<sitemap><loc>${escapeXml(entry.url)}</loc>${lastModified ? `<lastmod>${escapeXml(lastModified)}</lastmod>` : ""}</sitemap>`;
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`
  );
}

export function createSitemapResponse(xml: string) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export function buildPagedSitemapUrls(basePath: string, count: number) {
  const pageCount = Math.ceil(count / SITEMAP_PAGE_SIZE);
  return Array.from({ length: pageCount }, (_, page) => toAbsoluteSiteUrl(`${basePath}/${page}`));
}
