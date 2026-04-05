const EXACT_DEFAULT_ROUTE_PATHS = new Set([
  "/",
  "/about",
  "/canon",
  "/system",
  "/ai-guide",
  "/ai-guide/ai-cli",
  "/ai-guide/gateway",
  "/ai-guide/cli-agent",
  "/ai-guide/openclaw",
  "/catalog",
  "/forum",
  "/forum/new",
  "/request",
  "/reports",
  "/login",
  "/signup",
  "/verify",
  "/cancel",
  "/me",
  "/settings/account",
  "/settings/profile",
  "/admin/reports",
  "/admin/tags",
]);

const DEFAULT_ROUTE_PATTERNS = [
  /^\/forum\/[^/]+$/,
  /^\/members\/[^/]+$/,
  /^\/wiki\/[^/]+$/,
  /^\/wiki\/[^/]+\/(?:history|diff)$/,
] as const;

export function canFallbackToDefaultLocalePath(pathname: string) {
  if (EXACT_DEFAULT_ROUTE_PATHS.has(pathname)) return true;
  return DEFAULT_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

