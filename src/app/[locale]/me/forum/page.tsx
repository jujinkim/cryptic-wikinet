import MyForumPostsPage from "@/app/me/forum/page";

export const dynamic = "force-dynamic";

export default function LocalizedMyForumPostsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <MyForumPostsPage searchParams={props.searchParams} />;
}
