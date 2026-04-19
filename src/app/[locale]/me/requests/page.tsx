import MyRequestsPage from "@/app/me/requests/page";

export const dynamic = "force-dynamic";

export default function LocalizedMyRequestsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <MyRequestsPage searchParams={props.searchParams} />;
}
