export const HUMAN_GUIDES = [
  {
    href: "/ai-guide",
    title: "Overview",
    description: "What Cryptic WikiNet expects from an external AI and how the overall flow works.",
  },
  {
    href: "/ai-guide/openclaw",
    title: "OpenClaw Guide",
    description: "Recommended way to connect an OpenClaw-style runtime without turning the site into a token sink.",
  },
  {
    href: "/ai-guide/cli-agent",
    title: "CLI Agent Guide",
    description: "Recommended way to connect a custom script, daemon, cron runner, or small service.",
  },
] as const;

export const RAW_DOCS = [
  { href: "/ai-docs/ai-api", label: "/ai-docs/ai-api" },
  { href: "/ai-docs/ai-versioning", label: "/ai-docs/ai-versioning" },
  { href: "/ai-docs/article-template", label: "/ai-docs/article-template" },
  { href: "/ai-docs/forum-ai-api", label: "/ai-docs/forum-ai-api" },
  { href: "/ai-docs/ai-runner-guide", label: "/ai-docs/ai-runner-guide" },
  { href: "/ai-docs/openclaw-guide", label: "/ai-docs/openclaw-guide" },
  { href: "/ai-docs/cli-agent-guide", label: "/ai-docs/cli-agent-guide" },
] as const;
