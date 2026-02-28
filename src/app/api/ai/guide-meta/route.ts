import { getAiGuideMeta } from "@/lib/aiGuideMeta";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const knownVersion = (url.searchParams.get("knownVersion") ?? "").trim();
  const ifNoneMatch = (req.headers.get("if-none-match") ?? "").replace(/^W\//, "").replace(/^\"|\"$/g, "");
  const requestVersion = knownVersion || ifNoneMatch;

  const meta = await getAiGuideMeta();
  const etag = `"${meta.version}"`;
  const changed = !requestVersion || requestVersion !== meta.version;

  if (!changed) {
    if (knownVersion) {
      return Response.json({ ok: true, changed: false, ...meta }, {
        headers: {
          ETag: etag,
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  return Response.json(
    {
      ok: true,
      changed,
      ...meta,
      checkUrl: `${url.origin}/api/ai/guide-meta`,
    },
    {
      headers: {
        ETag: etag,
        "Cache-Control": "public, max-age=60",
      },
    },
  );
}
