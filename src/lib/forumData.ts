import { unstable_cache } from "next/cache";

import { CACHE_TAGS } from "@/lib/cacheTags";
import { prisma } from "@/lib/prisma";

export type ForumFilters = {
  authorType?: string;
  commentPolicy?: string;
  query?: string;
};

function normalizeForumFilters(args: ForumFilters) {
  return {
    authorType: String(args.authorType ?? "ALL").toUpperCase(),
    commentPolicy: String(args.commentPolicy ?? "ALL").toUpperCase(),
    query: String(args.query ?? "").trim(),
  };
}

async function loadForumPosts(args: ForumFilters) {
  const { authorType, commentPolicy, query } = normalizeForumFilters(args);

  const where: {
    authorType?: "AI" | "HUMAN";
    commentPolicy?: "HUMAN_ONLY" | "AI_ONLY" | "BOTH";
    OR?: Array<{
      title?: { contains: string; mode: "insensitive" };
      contentMd?: { contains: string; mode: "insensitive" };
    }>;
  } = {};

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { contentMd: { contains: query, mode: "insensitive" } },
    ];
  }

  if (authorType === "AI" || authorType === "HUMAN") {
    where.authorType = authorType;
  }

  if (
    commentPolicy === "HUMAN_ONLY" ||
    commentPolicy === "AI_ONLY" ||
    commentPolicy === "BOTH"
  ) {
    where.commentPolicy = commentPolicy;
  }

  return prisma.forumPost.findMany({
    where,
    orderBy: { lastActivityAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      lastActivityAt: true,
      authorType: true,
      commentPolicy: true,
      authorUser: { select: { id: true, name: true } },
      authorAiAccount: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
  });
}

async function loadForumPost(id: string) {
  return prisma.forumPost.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      contentMd: true,
      createdAt: true,
      updatedAt: true,
      lastActivityAt: true,
      authorType: true,
      commentPolicy: true,
      authorUser: { select: { id: true, name: true } },
      authorAiAccount: { select: { id: true, name: true } },
    },
  });
}

async function loadForumComments(postId: string) {
  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) return null;

  return prisma.forumComment.findMany({
    where: { postId: post.id },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      contentMd: true,
      createdAt: true,
      updatedAt: true,
      editedAt: true,
      authorType: true,
      authorUser: { select: { id: true, name: true } },
      authorAiAccount: { select: { id: true, name: true } },
    },
  });
}

export async function getCachedForumPosts(args: ForumFilters) {
  const normalized = normalizeForumFilters(args);
  return unstable_cache(
    async () => loadForumPosts(normalized),
    [`forum-posts:${JSON.stringify(normalized)}`],
    {
      revalidate: 60,
      tags: [CACHE_TAGS.forum],
    },
  )();
}

export async function getCachedForumPost(id: string) {
  return unstable_cache(async () => loadForumPost(id), [`forum-post:${id}`], {
    revalidate: 60,
    tags: [CACHE_TAGS.forum],
  })();
}

export async function getCachedForumComments(postId: string) {
  return unstable_cache(async () => loadForumComments(postId), [`forum-comments:${postId}`], {
    revalidate: 60,
    tags: [CACHE_TAGS.forum],
  })();
}
