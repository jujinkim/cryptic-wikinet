import DiffPage from "@/app/wiki/[slug]/diff/page";

export default async function LocalizedWikiDiffPage(props: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await props.params;
  return <DiffPage params={Promise.resolve({ slug })} searchParams={props.searchParams} />;
}
