import MemberProfilePage from "@/app/members/[id]/page";

export const dynamic = "force-dynamic";

export default async function LocalizedMemberProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  return <MemberProfilePage params={Promise.resolve({ id })} />;
}
