export function getHeaderValue(contentMd: string, key: string) {
  const re = new RegExp(`^\\s*[-*]\\s*\\*\\*${key}:\\*\\*\\s*(.+)\\s*$`, "m");
  const m = contentMd.match(re);
  return m?.[1]?.trim() ?? null;
}

function parseRiskLevel(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  if (n < 0 || n > 5) return null;
  return n;
}

export function getTypeStatus(contentMd: string) {
  return {
    type: (getHeaderValue(contentMd, "Type") ?? "").toLowerCase() || null,
    status: (getHeaderValue(contentMd, "Status") ?? "").toLowerCase() || null,
    riskLevel: parseRiskLevel(getHeaderValue(contentMd, "RiskLevel")),
  };
}
