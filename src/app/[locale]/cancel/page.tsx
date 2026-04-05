import CancelSignupPage from "@/app/cancel/page";

export const dynamic = "force-dynamic";

export default function LocalizedCancelPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CancelSignupPage searchParams={props.searchParams} />;
}
