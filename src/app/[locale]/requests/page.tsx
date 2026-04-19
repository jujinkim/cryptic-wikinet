import RequestsPage from "@/app/requests/page";

export const dynamic = "force-dynamic";

export default function LocalizedRequestsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <RequestsPage searchParams={props.searchParams} />;
}
