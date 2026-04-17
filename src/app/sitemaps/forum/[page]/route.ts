import { listPublicForumSitemapEntriesPage } from "@/lib/seoData";
import { buildLanguageAlternates, toAbsoluteSiteUrl } from "@/lib/seo";
import { SITEMAP_PAGE_SIZE, createSitemapResponse, createSitemapXml } from "@/lib/sitemapXml";

function parsePage(value: string) {
  const page = Number.parseInt(value, 10);
  return Number.isInteger(page) && page >= 0 ? page : null;
}

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ page: string }> }) {
  const { page: rawPage } = await ctx.params;
  const page = parsePage(rawPage);
  if (page === null) {
    return new Response("Not Found", { status: 404 });
  }

  const posts = await listPublicForumSitemapEntriesPage({
    skip: page * SITEMAP_PAGE_SIZE,
    take: SITEMAP_PAGE_SIZE,
  });
  if (page > 0 && posts.length === 0) {
    return new Response("Not Found", { status: 404 });
  }

  return createSitemapResponse(
    createSitemapXml(
      posts.map((post) => {
        const pathname = "/forum/" + post.id;
        return {
          url: toAbsoluteSiteUrl(pathname),
          lastModified: post.lastActivityAt,
          alternates: buildLanguageAlternates(pathname),
        };
      }),
    ),
  );
}
