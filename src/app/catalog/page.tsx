import Link from "next/link";
import CatalogClient from "@/app/catalog/catalog-client";
import { getCachedPublicArticles } from "@/lib/articleData";
import { getRequestSiteLocale } from "@/lib/request-site-locale";
import { withSiteLocale } from "@/lib/site-locale";
import { getCachedApprovedTags } from "@/lib/tagData";

function normalizeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function serializeDateValue(value: string | Date | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getRequestSiteLocale();
  const sp = await searchParams;
  const query = normalizeParam(sp.query);
  const tag = normalizeParam(sp.tag);
  const type = normalizeParam(sp.type).toLowerCase();
  const status = normalizeParam(sp.status).toLowerCase();

  const [items, approvedTags] = await Promise.all([
    getCachedPublicArticles({ query, tag, type, status }),
    getCachedApprovedTags(500),
  ]);

  const serializedItems = items.map((item) => ({
    ...item,
    updatedAt: serializeDateValue(item.updatedAt) ?? "",
  }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-6 text-sm">
        <Link className="underline" href={withSiteLocale("/", locale)}>
          ← Back to home
        </Link>
      </div>

      <CatalogClient
        initialItems={serializedItems}
        approvedTags={approvedTags}
        initialQuery={query}
        initialTag={tag}
        initialType={type}
        initialStatus={status}
      />
    </main>
  );
}
