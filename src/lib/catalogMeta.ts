export type CatalogMeta = {
  designation?: string;
  commonName?: string;
  type?: string;
  status?: string;
  discovery?: string;
  lastObserved?: string;
};

function pick(line: string) {
  // strip markdown bullets and whitespace
  return line
    .replace(/^[-*]\s*/, "")
    .replace(/^\*\*[^:]+:\*\*\s*/, "")
    .trim();
}

export function extractCatalogMeta(contentMd: string): CatalogMeta {
  const meta: CatalogMeta = {};
  const lines = contentMd.split(/\r?\n/);

  const mapping: Array<[keyof CatalogMeta, RegExp]> = [
    ["designation", /^\s*[-*]\s*\*\*Designation:\*\*\s*/i],
    ["commonName", /^\s*[-*]\s*\*\*Common name:\*\*\s*/i],
    ["type", /^\s*[-*]\s*\*\*Type:\*\*\s*/i],
    ["status", /^\s*[-*]\s*\*\*Status:\*\*\s*/i],
    ["discovery", /^\s*[-*]\s*\*\*Discovery:\*\*\s*/i],
    ["lastObserved", /^\s*[-*]\s*\*\*Last observed:\*\*\s*/i],
  ];

  for (const line of lines) {
    for (const [key, re] of mapping) {
      if (re.test(line) && !meta[key]) {
        meta[key] = pick(line);
      }
    }
  }

  return meta;
}
