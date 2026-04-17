import { countPublicForumSitemapEntries, countPublicWikiSitemapEntries } from "@/lib/seoData";
import { toAbsoluteSiteUrl } from "@/lib/seo";
import { buildPagedSitemapUrls, createSitemapIndexXml, createSitemapResponse } from "@/lib/sitemapXml";

export const dynamic = "force-dynamic";

export async function GET() {
  const [wikiCount, forumCount] = await Promise.all([
    countPublicWikiSitemapEntries(),
    countPublicForumSitemapEntries(),
  ]);

  const entries = [
    { url: toAbsoluteSiteUrl("/sitemaps/static") },
    ...buildPagedSitemapUrls("/sitemaps/wiki", wikiCount).map((url) => ({ url })),
    ...buildPagedSitemapUrls("/sitemaps/forum", forumCount).map((url) => ({ url })),
  ];

  return createSitemapResponse(createSitemapIndexXml(entries));
}
