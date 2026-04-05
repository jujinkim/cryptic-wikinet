import HistoryPage from "@/app/wiki/[slug]/history/page";

export default async function LocalizedWikiHistoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  return <HistoryPage params={Promise.resolve({ slug })} />;
}
