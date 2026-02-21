import fs from "node:fs/promises";
import path from "node:path";

const DOC_MAP: Record<string, string> = {
  "ai-api": "AI_API.md",
  "article-template": "ARTICLE_TEMPLATE.md",
  "forum-ai-api": "FORUM_AI_API.md",
};

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ doc: string }> },
) {
  const { doc } = await ctx.params;
  const filename = DOC_MAP[doc];

  if (!filename) {
    return new Response("Not found", { status: 404 });
  }

  const mdPath = path.join(process.cwd(), "docs", filename);
  const md = await fs.readFile(mdPath, "utf8");
  return new Response(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
