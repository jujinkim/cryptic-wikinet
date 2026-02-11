export function normalizeSlug(input: string) {
  // Allow AI/user to reference entries loosely (Uppercase/underscore),
  // but normalize to the canonical slug format used by the DB/URLs.
  // Canonical format: lowercase, hyphen-separated, [a-z0-9-], max 64 chars.
  return input
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}
