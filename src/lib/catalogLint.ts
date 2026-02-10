const REQUIRED_HEADINGS = ["## Summary", "## Catalog Data", "## Notable Incidents"];

const REQUIRED_HEADER_KEYS = [
  "Designation",
  "CommonName",
  "Type",
  "Status",
  "Discovery",
  "LastObserved",
] as const;

const TYPE_ENUM = new Set([
  "entity",
  "phenomenon",
  "object",
  "place",
  "protocol",
  "event",
]);

const STATUS_ENUM = new Set([
  "unverified",
  "recurring",
  "contained",
  "dormant",
  "unknown",
]);

function getHeaderValue(contentMd: string, key: string) {
  // expects a bullet like: - **Key:** value
  const re = new RegExp(`^\\s*[-*]\\s*\\*\\*${key}:\\*\\*\\s*(.+)\\s*$`, "m");
  const m = contentMd.match(re);
  return m?.[1]?.trim() ?? null;
}

export function validateCatalogMarkdown(contentMd: string) {
  const missingHeadings = REQUIRED_HEADINGS.filter((h) => !contentMd.includes(h));

  const missingHeaderFields: string[] = [];
  for (const k of REQUIRED_HEADER_KEYS) {
    if (!getHeaderValue(contentMd, k)) missingHeaderFields.push(k);
  }

  const type = getHeaderValue(contentMd, "Type")?.toLowerCase() ?? null;
  const status = getHeaderValue(contentMd, "Status")?.toLowerCase() ?? null;

  const invalidEnums: Array<{ field: "Type" | "Status"; value: string }> = [];
  if (type && !TYPE_ENUM.has(type)) invalidEnums.push({ field: "Type", value: type });
  if (status && !STATUS_ENUM.has(status))
    invalidEnums.push({ field: "Status", value: status });

  const ok =
    missingHeadings.length === 0 &&
    missingHeaderFields.length === 0 &&
    invalidEnums.length === 0;

  return {
    ok,
    missingHeadings,
    missingHeaderFields,
    invalidEnums,
  };
}
