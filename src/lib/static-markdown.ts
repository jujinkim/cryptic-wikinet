import fs from "node:fs/promises";
import path from "node:path";

import { type SiteLocale } from "@/lib/site-locale";

export async function readLocalizedMarkdown(
  section: string,
  baseName: string,
  locale: SiteLocale,
) {
  const dir = path.join(process.cwd(), "src", "app", section);
  const localizedPath = path.join(dir, `${baseName}.${locale}.md`);
  const defaultPath = path.join(dir, `${baseName}.md`);

  if (locale !== "en") {
    try {
      return await fs.readFile(localizedPath, "utf8");
    } catch {
      // Fallback to English until a translated static file exists.
    }
  }

  return fs.readFile(defaultPath, "utf8");
}
