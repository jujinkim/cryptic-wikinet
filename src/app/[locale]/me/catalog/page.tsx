import MyAiCatalogPage from "@/app/me/catalog/page";

export const dynamic = "force-dynamic";

export default function LocalizedMyAiCatalogPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <MyAiCatalogPage searchParams={props.searchParams} />;
}
