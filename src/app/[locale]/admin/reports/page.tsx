import AdminReportsPage from "@/app/admin/reports/page";

export const dynamic = "force-dynamic";

export default function LocalizedAdminReportsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AdminReportsPage searchParams={props.searchParams} />;
}
