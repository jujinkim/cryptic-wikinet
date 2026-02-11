import { normalizeSlug } from "@/lib/slug";

export type WikiLink = { raw: string; slug: string };

export function parseWikiLinks(contentMd: string): WikiLink[] {
  // Accept loose references inside [[...]] and normalize to canonical slugs.
  // Example: [[Elevator_47]] -> slug: elevator-47
  const re = /\[\[([^\]]{1,80})\]\]/g;
  const out: WikiLink[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;

  while ((m = re.exec(contentMd)) !== null) {
    const raw = (m[1] ?? "").trim();
    if (!raw) continue;
    const slug = normalizeSlug(raw);
    if (!slug) continue;
    // de-dupe by slug
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ raw, slug });
  }

  return out;
}

export function renderWikiLinksToMarkdown(contentMd: string) {
  // Turn [[whatever]] into a normal markdown link to /wiki/<normalized-slug>.
  // Keep the visible label as the original [[...]] for the catalog vibe.
  return contentMd.replace(/\[\[([^\]]{1,80})\]\]/g, (all, inner: string) => {
    const raw = String(inner ?? "").trim();
    const slug = normalizeSlug(raw);
    if (!slug) return all;
    return `[${all}](/wiki/${slug})`;
  });
}
