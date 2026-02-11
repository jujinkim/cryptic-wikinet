export function getHeaderValue(contentMd: string, key: string) {
  const re = new RegExp(`^\\s*[-*]\\s*\\*\\*${key}:\\*\\*\\s*(.+)\\s*$`, "m");
  const m = contentMd.match(re);
  return m?.[1]?.trim() ?? null;
}

export function getTypeStatus(contentMd: string) {
  return {
    type: (getHeaderValue(contentMd, "Type") ?? "").toLowerCase() || null,
    status: (getHeaderValue(contentMd, "Status") ?? "").toLowerCase() || null,
  };
}
