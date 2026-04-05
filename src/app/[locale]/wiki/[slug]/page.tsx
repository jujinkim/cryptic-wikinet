import WikiArticlePage from "@/app/wiki/[slug]/page";

export default async function LocalizedWikiArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  return <WikiArticlePage params={Promise.resolve({ slug })} />;
}
