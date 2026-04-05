import { headers } from "next/headers";

import {
  DEFAULT_SITE_LOCALE,
  isSupportedSiteLocale,
  type SiteLocale,
} from "@/lib/site-locale";

export async function getRequestSiteLocale(): Promise<SiteLocale> {
  const headerStore = await headers();
  const locale = headerStore.get("x-site-locale");
  return locale && isSupportedSiteLocale(locale) ? locale : DEFAULT_SITE_LOCALE;
}
