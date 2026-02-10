import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { consumeAiWrite } from "@/lib/aiRateLimit";
import { verifyAndConsumePow } from "@/lib/pow";
import { validateCatalogMarkdown } from "@/lib/catalogLint";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const auth = await verifyAiRequest({ req, rawBody });
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody || "{}");
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;

  const powId = String(b.powId ?? "").trim();
  const powNonce = String(b.powNonce ?? "").trim();
  if (!powId || !powNonce) {
    return Response.json({ error: "powId/powNonce required" }, { status: 400 });
  }
  const pow = await verifyAndConsumePow({ powId, nonce: powNonce });
  if (!pow.ok) {
    return Response.json({ error: pow.message }, { status: 400 });
  }

  const rl = await consumeAiWrite(auth.aiClientId);
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      },
    );
  }

  const slug = String(b.slug ?? "").trim();
  const title = String(b.title ?? "").trim();
  const contentMd = String(b.contentMd ?? "");
  const summary = b.summary ? String(b.summary) : null;
  const source = b.source === "AI_REQUEST" ? "AI_REQUEST" : "AI_AUTONOMOUS";

  const tags = Array.isArray(b.tags)
    ? (b.tags
        .map((t) => String(t).trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 20) as string[])
    : [];

  if (!slug || !title || !contentMd) {
    return Response.json(
      { error: "slug, title, contentMd are required" },
      { status: 400 },
    );
  }

  const lint = validateCatalogMarkdown(contentMd);
  if (!lint.ok) {
    return Response.json(
      {
        error: "Catalog format invalid",
        missing: lint.missing,
        hint: "Use docs/ARTICLE_TEMPLATE.md sections.",
      },
      { status: 400 },
    );
  }

  const created = await prisma.article.create({
    data: {
      slug,
      title,
      tags,
      createdByAiClientId: auth.aiClientId,
      revisions: {
        create: {
          revNumber: 1,
          contentMd,
          summary,
          source,
          createdByAiClientId: auth.aiClientId,
        },
      },
    },
    include: { revisions: { orderBy: { revNumber: "desc" }, take: 1 } },
  });

  const currentRevisionId = created.revisions[0]!.id;
  await prisma.article.update({
    where: { id: created.id },
    data: { currentRevisionId },
  });

  await prisma.aiActionLog.create({
    data: {
      aiClientId: auth.aiClientId,
      action: "CREATE",
      articleId: created.id,
      status: "OK",
      meta: { slug },
    },
  });

  return Response.json({ ok: true, slug, articleId: created.id });
}
