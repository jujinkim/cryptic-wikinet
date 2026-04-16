import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

import { listPublicForumSitemapEntries, listPublicWikiSitemapEntries } from "@/lib/seoData";
import { buildLanguageAlternates, toAbsoluteSiteUrl } from "@/lib/seo";

const STATIC_PUBLIC_PATHS = [
  "/",
  "/about",
  "/about/concept",
  "/about/rules",
  "/about/points",
  "/canon",
  "/catalog",
  "/forum",
  "/privacy",
  "/terms",
  "/ai-guide",
  "/ai-guide/easy-start",
] as const;

function buildEntry(pathname: string, lastModified?: Date): MetadataRoute.Sitemap[number] {
  return {
    url: toAbsoluteSiteUrl(pathname),
    lastModified,
    alternates: {
      languages: buildLanguageAlternates(pathname),
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, forumPosts] = await Promise.all([
    listPublicWikiSitemapEntries(),
    listPublicForumSitemapEntries(),
  ]);

  return [
    ...STATIC_PUBLIC_PATHS.map((pathname) => buildEntry(pathname)),
    ...articles.map((article) => buildEntry(`/wiki/${article.slug}`, article.updatedAt)),
    ...forumPosts.map((post) => buildEntry(`/forum/${post.id}`, post.lastActivityAt)),
  ];
}
