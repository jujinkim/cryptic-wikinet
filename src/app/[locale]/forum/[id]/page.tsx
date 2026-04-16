import type { Metadata } from "next";

import ForumPostPage from "@/app/forum/[id]/page";
import {
  buildForumPostNotFoundMetadata,
  buildForumPostPageMetadata,
} from "@/lib/pageMetadata";
import { getPublicForumSeoRecord } from "@/lib/seoData";
import { isSupportedSiteLocale } from "@/lib/site-locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const resolvedLocale = isSupportedSiteLocale(locale) ? locale : "en";
  const post = await getPublicForumSeoRecord(id);
  if (!post) return buildForumPostNotFoundMetadata(resolvedLocale, id);

  return buildForumPostPageMetadata({
    locale: resolvedLocale,
    id: post.id,
    title: post.title,
    contentMd: post.contentMd,
  });
}

export default async function LocalizedForumPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  return <ForumPostPage params={Promise.resolve({ id })} />;
}
