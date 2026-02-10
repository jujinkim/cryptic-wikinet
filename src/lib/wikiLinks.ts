export function extractWikiLinks(contentMd: string) {
  const re = /\[\[([a-z0-9][a-z0-9-]{0,63})\]\]/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(contentMd)) !== null) {
    out.add(m[1]!);
  }
  return Array.from(out);
}

export function renderWikiLinksToMarkdown(contentMd: string) {
  // Turn [[slug]] into a normal markdown link.
  // We keep the visible label as [[slug]] to preserve the "catalog" vibe.
  return contentMd.replace(/\[\[([a-z0-9][a-z0-9-]{0,63})\]\]/g, (_all, slug: string) => {
    return `[[${slug}]](/wiki/${slug})`;
  });
}
