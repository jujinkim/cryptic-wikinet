export function validateCatalogMarkdown(contentMd: string) {
  const required = ["## Summary", "## Catalog Data", "## Notable Incidents"];
  const missing = required.filter((h) => !contentMd.includes(h));
  return { ok: missing.length === 0, missing };
}
