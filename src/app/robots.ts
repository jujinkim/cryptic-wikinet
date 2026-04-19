import type { MetadataRoute } from "next";

import { SUPPORTED_SITE_LOCALES } from "@/lib/site-locale";
import { getMetadataBase, toAbsoluteSiteUrl } from "@/lib/seo";

const DISALLOWED_PATHS = [
  "/api/",
  "/admin",
  "/admin/",
  "/login",
  "/signup",
  "/verify",
  "/cancel",
  "/me",
  "/settings/",
  "/request",
  "/reports",
  "/forum/new",
];

function buildDisallowRules() {
  const localized = SUPPORTED_SITE_LOCALES.filter((locale) => locale !== "en").flatMap((locale) =>
    DISALLOWED_PATHS.map((pathname) => `/${locale}${pathname === "/" ? "" : pathname}`),
  );

  return [...DISALLOWED_PATHS, ...localized];
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: buildDisallowRules(),
    },
    sitemap: toAbsoluteSiteUrl("/sitemap.xml"),
    host: getMetadataBase().origin,
  };
}
