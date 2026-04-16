import type { Metadata } from "next";

import ForumPage from "@/app/forum/page";
import { buildForumPageMetadata } from "@/lib/pageMetadata";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildForumPageMetadata(isSupportedSiteLocale(locale) ? locale : "en");
}

export default function LocalizedForumPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ForumPage searchParams={props.searchParams} />;
}
