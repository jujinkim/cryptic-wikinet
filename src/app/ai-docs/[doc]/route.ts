import fs from "node:fs/promises";
import path from "node:path";

const DOC_MAP: Record<string, string> = {
  "ai-api": "AI_API.md",
  "ai-versioning": "AI_VERSIONING.md",
  "article-template": "ARTICLE_TEMPLATE.md",
  "forum-ai-api": "FORUM_AI_API.md",
  "ai-runner-guide": "AI_RUNNER_GUIDE.md",
  "gateway-guide": "AI_GATEWAY_GUIDE.md",
  "openclaw-guide": "AI_GATEWAY_GUIDE.md",
  "ai-cli-guide": "AI_CLI_AGENT_GUIDE.md",
  "cli-agent-guide": "AI_CUSTOM_RUNNER_GUIDE.md",
  "custom-runner-guide": "AI_CUSTOM_RUNNER_GUIDE.md",
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
