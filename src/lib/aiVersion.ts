export type AiApiPhase = "prelaunch" | "stable" | "sunset" | "retired";

export type AiApiMeta = {
  phase: AiApiPhase;
  breakingAllowed: boolean;
  defaultVersion: "v1";
  latestVersion: string;
  minSupportedVersion: string;
  sunsetAt: string | null;
  retiredVersions: string[];
  urls: {
    meta: string;
    guide: string;
    versioning: string;
    migration: string;
  };
};

function envStr(name: string, fallback: string) {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : fallback;
}

function normalizePhase(raw: string): AiApiPhase {
  const v = raw.trim().toLowerCase();
  if (v === "prelaunch" || v === "stable" || v === "sunset" || v === "retired") {
    return v;
  }
  if (v === "deprecated") return "sunset";
  return "prelaunch";
}

function normalizeIsoOrNull(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function resolveUrl(origin: string, raw: string) {
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${origin}${raw}`;
  return `${origin}/${raw}`;
}

export function getAiApiMeta(args: { origin: string }): AiApiMeta {
  const phase = normalizePhase(envStr("AI_API_PHASE", "prelaunch"));
  const latestVersion = envStr("AI_API_LATEST_VERSION", "v1");
  const minSupportedVersion = envStr("AI_API_MIN_SUPPORTED_VERSION", "v1");
  const sunsetAt = normalizeIsoOrNull(envStr("AI_API_SUNSET_AT", ""));

  const guide = resolveUrl(args.origin, envStr("AI_API_GUIDE_URL", "/ai-docs/ai-api"));
  const versioning = resolveUrl(
    args.origin,
    envStr("AI_API_VERSIONING_URL", "/ai-docs/ai-versioning"),
  );
  const migration = resolveUrl(args.origin, envStr("AI_API_MIGRATION_URL", "/ai-guide"));
  const meta = resolveUrl(args.origin, "/api/ai/meta");

  return {
    phase,
    breakingAllowed: phase === "prelaunch",
    defaultVersion: "v1",
    latestVersion,
    minSupportedVersion,
    sunsetAt,
    retiredVersions: phase === "retired" ? ["v1"] : [],
    urls: {
      meta,
      guide,
      versioning,
      migration,
    },
  };
}

function versionHeaders(meta: AiApiMeta) {
  const headers: Record<string, string> = {
    "X-AI-API-Phase": meta.phase,
    "X-AI-API-Latest-Version": meta.latestVersion,
    "X-AI-API-Min-Supported-Version": meta.minSupportedVersion,
    Link: [
      `<${meta.urls.meta}>; rel="service-desc"`,
      `<${meta.urls.guide}>; rel="describedby"`,
      `<${meta.urls.versioning}>; rel="help"`,
      `<${meta.urls.migration}>; rel="help"`,
    ].join(", "),
  };

  if (meta.sunsetAt) {
    headers.Sunset = meta.sunsetAt;
  }

  if (meta.phase === "sunset") {
    headers.Warning = '299 - "v1 is deprecated and will be retired; migrate to a supported version"';
  }

  return headers;
}

export function aiVersionHeadersFor(req: Request) {
  const origin = new URL(req.url).origin;
  const meta = getAiApiMeta({ origin });
  return versionHeaders(meta);
}

export function retiredV1Response(req: Request) {
  const origin = new URL(req.url).origin;
  const meta = getAiApiMeta({ origin });

  return Response.json(
    {
      ok: false,
      error: "Current AI API version is retired. Upgrade required.",
      errorCode: "API_VERSION_UNSUPPORTED",
      minSupportedVersion: meta.minSupportedVersion,
      latestVersion: meta.latestVersion,
      sunsetAt: meta.sunsetAt,
      metaUrl: meta.urls.meta,
      guideUrl: meta.urls.guide,
      migrationUrl: meta.urls.migration,
    },
    { status: 410, headers: versionHeaders(meta) },
  );
}

export function requireAiV1Available(req: Request): Response | null {
  const origin = new URL(req.url).origin;
  const meta = getAiApiMeta({ origin });
  if (meta.phase !== "retired") return null;
  return retiredV1Response(req);
}
