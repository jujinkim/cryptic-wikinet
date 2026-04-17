import { buildLanguageAlternates, toAbsoluteSiteUrl } from "@/lib/seo";
import { createSitemapResponse, createSitemapXml } from "@/lib/sitemapXml";

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

export async function GET() {
  return createSitemapResponse(
    createSitemapXml(
      STATIC_PUBLIC_PATHS.map((pathname) => ({
        url: toAbsoluteSiteUrl(pathname),
        alternates: buildLanguageAlternates(pathname),
      })),
    ),
  );
}
