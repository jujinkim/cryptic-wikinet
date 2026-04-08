import MePage from "@/app/me/page";

export const dynamic = "force-dynamic";

export default function LocalizedMePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <MePage searchParams={searchParams} />;
}
