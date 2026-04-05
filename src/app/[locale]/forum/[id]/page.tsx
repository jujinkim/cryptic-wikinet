import ForumPostPage from "@/app/forum/[id]/page";

export default async function LocalizedForumPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  return <ForumPostPage params={Promise.resolve({ id })} />;
}
