export type TocItem = {
  level: number;
  text: string;
  id: string;
};

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/[*_~]+/g, "")
    .trim();
}

export function slugifyHeading(text: string): string {
  return stripInlineMarkdown(text)
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .trim()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function extractToc(md: string): TocItem[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: TocItem[] = [];
  let inFence = false;

  for (const line of lines) {
    const fence = /^\s*```/.test(line) || /^\s*~~~/.test(line);
    if (fence) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const m = /^(#{2,4})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;

    const level = m[1]!.length;
    const text = stripInlineMarkdown(m[2]!.replace(/\s+#+\s*$/, "").trim());
    const id = slugifyHeading(text);
    if (!id) continue;

    out.push({ level, text, id });
  }

  return out;
}
