import { unstable_cache } from "next/cache";

import { CACHE_TAGS } from "@/lib/cacheTags";
import { prisma } from "@/lib/prisma";

export type ApprovedTag = {
  key: string;
  label: string;
};

async function loadApprovedTags(limit: number): Promise<ApprovedTag[]> {
  return prisma.tag.findMany({
    orderBy: { label: "asc" },
    take: limit,
    select: { key: true, label: true },
  });
}

export async function getCachedApprovedTags(limit = 500) {
  return unstable_cache(async () => loadApprovedTags(limit), [`approved-tags:${limit}`], {
    revalidate: 300,
    tags: [CACHE_TAGS.tags, CACHE_TAGS.wikiNav],
  })();
}

export async function getCachedApprovedTagKeys(limit = 500) {
  const rows = await getCachedApprovedTags(limit);
  return rows.map((row) => row.key);
}
