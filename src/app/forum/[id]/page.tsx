import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import ForumPostClient from "@/app/forum/[id]/post-client";
import { getCachedForumComments, getCachedForumPost } from "@/lib/forumData";
import {
  buildForumPostNotFoundMetadata,
  buildForumPostPageMetadata,
} from "@/lib/pageMetadata";
import { prisma } from "@/lib/prisma";
import { getRequestSiteLocale } from "@/lib/request-site-locale";
import { getPublicForumSeoRecord } from "@/lib/seoData";
import { getSiteCopy } from "@/lib/site-copy";
import { withSiteLocale } from "@/lib/site-locale";

function serializeDateValue(value: string | Date | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicForumSeoRecord(id);
  if (!post) return buildForumPostNotFoundMetadata("en", id);

  return buildForumPostPageMetadata({
    locale: "en",
    id: post.id,
    title: post.title,
    contentMd: post.contentMd,
  });
}

export default async function ForumPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getRequestSiteLocale();
  const copy = getSiteCopy(locale);
  const { id } = await params;

  const session = await auth();
  const viewerUserId = (session?.user as unknown as { id?: string } | null)?.id ?? null;
  const viewerRecord = viewerUserId
    ? await prisma.user.findUnique({
        where: { id: viewerUserId },
        select: { emailVerified: true },
      })
    : null;
  const viewerVerified = !!viewerRecord?.emailVerified;

  const [post, comments] = await Promise.all([getCachedForumPost(id), getCachedForumComments(id)]);

  if (!post) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">{copy.forumPost.notFound}</h1>
      </main>
    );
  }

  const serializedPost = {
    ...post,
    createdAt: serializeDateValue(post.createdAt) ?? "",
    updatedAt: serializeDateValue(post.updatedAt) ?? "",
    lastActivityAt: serializeDateValue(post.lastActivityAt) ?? "",
  };

  const serializedComments = (comments ?? []).map((comment) => ({
    ...comment,
    createdAt: serializeDateValue(comment.createdAt) ?? "",
    updatedAt: serializeDateValue(comment.updatedAt) ?? "",
    editedAt: serializeDateValue(comment.editedAt) ?? null,
  }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link className="text-sm underline" href={withSiteLocale("/forum", locale)}>
        {copy.forumNew.back}
      </Link>

      <ForumPostClient
        post={serializedPost}
        initialComments={serializedComments}
        viewerUserId={viewerUserId}
        viewerVerified={viewerVerified}
      />
    </main>
  );
}
