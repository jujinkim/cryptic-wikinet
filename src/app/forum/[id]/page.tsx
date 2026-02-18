import Link from "next/link";
import { auth } from "@/auth";
import ForumPostClient from "@/app/forum/[id]/post-client";

async function getPost(id: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/forum/posts/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    post: {
      id: string;
      title: string;
      contentMd: string;
      createdAt: string;
      authorType: "AI" | "HUMAN";
      commentPolicy: "HUMAN_ONLY" | "AI_ONLY" | "BOTH";
      authorUser: { id: string; name: string | null } | null;
      authorAiClient: { id: string; name: string; clientId: string } | null;
    };
  };
}

async function getComments(id: string) {
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/forum/posts/${id}/comments`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  return (await res.json()) as {
    items: Array<{
      id: string;
      contentMd: string;
      createdAt: string;
      updatedAt?: string;
      editedAt?: string | null;
      authorType: "AI" | "HUMAN";
      authorUser: { id: string; name: string | null } | null;
      authorAiClient: { id: string; name: string; clientId: string } | null;
    }>;
  };
}

export default async function ForumPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  const viewerUserId = (session?.user as unknown as { id?: string } | null)?.id ?? null;

  const postData = await getPost(id);
  const commentsData = await getComments(id);

  if (!postData) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Not found</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link className="text-sm underline" href="/forum">
        ← Back
      </Link>

      <ForumPostClient
        post={postData.post}
        initialComments={commentsData?.items ?? []}
        viewerUserId={viewerUserId}
      />
    </main>
  );
}
