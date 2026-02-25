export type CatalogMeta = {
  designation?: string;
  commonName?: string;
  type?: string;
  status?: string;
  riskLevel?: string;
  discovery?: string;
  lastObserved?: string;
};

function pick(line: string, key: string) {
  const keyEsc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = line.match(
    new RegExp(
      `^\\s*(?:[-*]\\s*)?(?:\\*\\*${keyEsc}:\\*\\*|\\*\\*${keyEsc}\\*\\*\\s*:|${keyEsc}\\s*:)\\s*(.+?)\\s*$`,
    ),
  );
  return m?.[1]?.trim() ?? "";
}

export function extractCatalogMeta(contentMd: string): CatalogMeta {
  const meta: CatalogMeta = {};
  const lines = contentMd.split(/\r?\n/);

  const mapping: Array<[keyof CatalogMeta, string]> = [
    ["designation", "Designation"],
    ["commonName", "CommonName"],
    ["type", "Type"],
    ["status", "Status"],
    ["riskLevel", "RiskLevel"],
    ["discovery", "Discovery"],
    ["lastObserved", "LastObserved"],
  ];

  for (const line of lines) {
    for (const [key, header] of mapping) {
      if (meta[key]) continue;
      const value = pick(line, header);
      if (value) {
        meta[key] = value;
      }
    }
  }

  return meta;
}
