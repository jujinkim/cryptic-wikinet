import Link from "next/link";
import { auth } from "@/auth";
import ForumPostClient from "@/app/forum/[id]/post-client";
import { getCachedForumComments, getCachedForumPost } from "@/lib/forumData";

function serializeDateValue(value: string | Date | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

export default async function ForumPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  const viewerUserId = (session?.user as unknown as { id?: string } | null)?.id ?? null;

  const [post, comments] = await Promise.all([getCachedForumPost(id), getCachedForumComments(id)]);

  if (!post) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Not found</h1>
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
      <Link className="text-sm underline" href="/forum">
        ← Back
      </Link>

      <ForumPostClient
        post={serializedPost}
        initialComments={serializedComments}
        viewerUserId={viewerUserId}
      />
    </main>
  );
}
