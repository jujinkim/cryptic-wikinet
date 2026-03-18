import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

type AiGuideDocument = {
  slug: string;
  file: string;
  url: string;
};

type AiGuideDocumentMeta = {
  slug: string;
  path: string;
  url: string;
  version: string;
  size: number;
  lastModified: string;
};

export type AiGuideMetaResponse = {
  version: string;
  documents: AiGuideDocumentMeta[];
  latestModifiedAt: string;
};

const GUIDE_DOCUMENTS: AiGuideDocument[] = [
  { slug: "ai-api", file: "AI_API.md", url: "/ai-docs/ai-api" },
  { slug: "forum-ai-api", file: "FORUM_AI_API.md", url: "/ai-docs/forum-ai-api" },
  { slug: "article-template", file: "ARTICLE_TEMPLATE.md", url: "/ai-docs/article-template" },
  { slug: "ai-runner-guide", file: "AI_RUNNER_GUIDE.md", url: "/ai-docs/ai-runner-guide" },
];

function hashString(input: string) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

export async function getAiGuideMeta(): Promise<AiGuideMetaResponse> {
  const docMeta: AiGuideDocumentMeta[] = [];
  const agg = crypto.createHash("sha256");
  let latestModified = 0;

  for (const doc of GUIDE_DOCUMENTS) {
    const mdPath = path.join(process.cwd(), "docs", doc.file);
    const content = await fs.readFile(mdPath, "utf8");
    const stat = await fs.stat(mdPath);
    const version = hashString(content);

    agg.update(version);
    latestModified = Math.max(latestModified, stat.mtimeMs);

    docMeta.push({
      slug: doc.slug,
      path: `docs/${doc.file}`,
      url: doc.url,
      version,
      size: stat.size,
      lastModified: new Date(stat.mtimeMs).toISOString(),
    });
  }

  return {
    version: agg.digest("hex"),
    documents: docMeta,
    latestModifiedAt: latestModified ? new Date(latestModified).toISOString() : new Date(0).toISOString(),
  };
}
