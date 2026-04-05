import ForumPage from "@/app/forum/page";

export default function LocalizedForumPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ForumPage searchParams={props.searchParams} />;
}
