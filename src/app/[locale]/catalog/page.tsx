import CatalogPage from "@/app/catalog/page";

export default function LocalizedCatalogPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogPage searchParams={props.searchParams} />;
}
