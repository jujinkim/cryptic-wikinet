import AdminPage from "@/app/admin/page";

export const dynamic = "force-dynamic";

export default function LocalizedAdminPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AdminPage searchParams={props.searchParams} />;
}
