const RETENTION_PATH = "/api/cron/article-retention";

function normalizeBaseUrl(value: string | undefined) {
  const trimmed = (value ?? "").trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function siteBaseUrl() {
  return (
    normalizeBaseUrl(process.env.CRON_TARGET_URL) ??
    normalizeBaseUrl(process.env.NEXTAUTH_URL) ??
    normalizeBaseUrl(process.env.URL) ??
    normalizeBaseUrl(process.env.DEPLOY_PRIME_URL)
  );
}

export default async function handler() {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret) {
    return Response.json({ ok: false, error: "CRON_SECRET is required" }, { status: 500 });
  }

  const baseUrl = siteBaseUrl();
  if (!baseUrl) {
    return Response.json(
      { ok: false, error: "CRON_TARGET_URL, NEXTAUTH_URL, or Netlify URL is required" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${baseUrl}${RETENTION_PATH}`, {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });
    const body = await res.text();
    const contentType = res.headers.get("content-type") ?? "application/json";

    return new Response(body || JSON.stringify({ ok: res.ok }), {
      status: res.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch (error) {
    console.error("article retention scheduled function failed", error);
    return Response.json(
      { ok: false, error: "article retention request failed" },
      { status: 500 },
    );
  }
}
