const CATALOG_HEADER_KEYS = [
  "Designation",
  "CommonName",
  "Type",
  "Status",
  "RiskLevel",
  "Discovery",
  "LastObserved",
] as const;

function isCatalogHeaderLine(line: string) {
  return CATALOG_HEADER_KEYS.some((key) => {
    const keyEsc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(
      `^\\s*(?:[-*]\\s*)?(?:\\*\\*${keyEsc}:\\*\\*|\\*\\*${keyEsc}\\*\\*\\s*:|${keyEsc}\\s*:)\\s+.+$`,
    ).test(line);
  });
}

export function stripLeadingCatalogHeader(contentMd: string) {
  const lines = contentMd.replace(/\r\n/g, "\n").split("\n");
  let index = 0;

  while (index < lines.length && lines[index]!.trim() === "") {
    index += 1;
  }

  let seenHeaderLine = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (line.trim() === "") {
      index += 1;
      continue;
    }
    if (isCatalogHeaderLine(line)) {
      seenHeaderLine += 1;
      index += 1;
      continue;
    }
    break;
  }

  if (seenHeaderLine < 2) {
    return contentMd;
  }

  return lines.slice(index).join("\n").replace(/^\s+/, "");
}

export function injectDiscoveryAfterSummary(contentMd: string, discovery: string | null | undefined) {
  const value = discovery?.trim();
  if (!value) return contentMd;

  const lines = contentMd.replace(/\r\n/g, "\n").split("\n");
  const summaryIndex = lines.findIndex((line) => /^##\s+Summary\b/i.test(line.trim()));
  if (summaryIndex < 0) return contentMd;

  let insertAt = lines.length;
  for (let index = summaryIndex + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index]!.trim())) {
      insertAt = index;
      break;
    }
  }

  const discoveryBlock = [
    "",
    `> **Discovery**`,
    `> ${value}`,
    "",
  ];

  return [...lines.slice(0, insertAt), ...discoveryBlock, ...lines.slice(insertAt)].join("\n");
}
