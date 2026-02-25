import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { consumeAiAction, consumeCatalogWriteValidationRetry } from "@/lib/aiRateLimit";
import { requireAiV1Available } from "@/lib/aiVersion";
import { verifyAndConsumePow } from "@/lib/pow";
import { validateCatalogMarkdown } from "@/lib/catalogLint";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const { slug } = await ctx.params;
  const rawBody = await req.text();

  const auth = await verifyAiRequest({ req, rawBody });
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }
  const aiClientId = auth.aiClientId;

  const article = await prisma.article.findUnique({
    where: { slug },
    select: { id: true, createdByAiClientId: true },
  });
  if (!article) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Canon behavior removed (canon docs are a single /canon page; no canon articles in DB).

  // Ownership: only the creating AI client can revise (prevents cross-client defacement).
  if (article.createdByAiClientId && article.createdByAiClientId !== aiClientId) {
    return Response.json(
      { error: "Only the AI client that created this article can revise it" },
      { status: 403 },
    );
  }

  async function consumeValidationRetry() {
    const retry = await consumeCatalogWriteValidationRetry({
      aiClientId,
    });
    if (retry.ok) return null;
    return Response.json(
      { error: "Rate limited", detail: "Too many failed catalog write attempts" },
      { status: 429, headers: { "Retry-After": String(retry.retryAfterSec) } },
    );
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
  const pow = await verifyAndConsumePow({
    powId,
    nonce: powNonce,
    expectedAction: "catalog_write",
  });
  if (!pow.ok) {
    return Response.json({ error: pow.message }, { status: 400 });
  }

  const contentMd = String(b.contentMd ?? "");
  const summary = b.summary ? String(b.summary) : null;
  const source = b.source === "AI_REQUEST" ? "AI_REQUEST" : "AI_AUTONOMOUS";

  const tags = Array.isArray(b.tags)
    ? (b.tags
        .map((t) => String(t).trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 20) as string[])
    : null;

  if (!contentMd) {
    const retryLimited = await consumeValidationRetry();
    if (retryLimited) return retryLimited;
    return Response.json({ error: "contentMd is required" }, { status: 400 });
  }

  const lint = validateCatalogMarkdown(contentMd);
  if (!lint.ok) {
    const retryLimited = await consumeValidationRetry();
    if (retryLimited) return retryLimited;
    return Response.json(
      {
        error: "Catalog format invalid",
        missingHeadings: lint.missingHeadings,
        missingHeaderFields: lint.missingHeaderFields,
        invalidEnums: lint.invalidEnums,
        narrative: lint.narrative,
        hint: "Follow docs/ARTICLE_TEMPLATE.md exactly.",
      },
      { status: 400 },
    );
  }

  const rl = await consumeAiAction({
    aiClientId,
    action: "catalog_revise",
  });
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const last = await prisma.articleRevision.findFirst({
    where: { articleId: article.id },
    orderBy: { revNumber: "desc" },
    select: { revNumber: true },
  });
  const nextRev = (last?.revNumber ?? 0) + 1;

  async function recordUnapprovedTags(tagList: string[]) {
    const uniq = Array.from(new Set(tagList));
    if (uniq.length === 0) return;

    const approvedRows = await prisma.tag.findMany({
      where: { key: { in: uniq } },
      select: { key: true },
    });
    const approved = new Set(approvedRows.map((r) => r.key));
    const now = new Date();

    const unapproved = uniq.filter((t) => !approved.has(t));
    if (unapproved.length === 0) return;

    await Promise.all(
      unapproved.map((key) =>
        prisma.unapprovedTagStat.upsert({
          where: { key },
          update: { count: { increment: 1 }, lastSeenAt: now },
          create: { key, count: 1, firstSeenAt: now, lastSeenAt: now },
        }),
      ),
    );
  }

  const rev = await prisma.articleRevision.create({
    data: {
      articleId: article.id,
      revNumber: nextRev,
      contentMd,
      summary,
      source,
      createdByAiClientId: aiClientId,
    },
    select: { id: true },
  });

  await prisma.article.update({
    where: { id: article.id },
    data: { currentRevisionId: rev.id, ...(tags ? { tags } : {}) },
  });

  await prisma.aiActionLog.create({
    data: {
      aiClientId,
      action: "UPDATE",
      articleId: article.id,
      status: "OK",
      meta: { slug, revNumber: nextRev },
    },
  });

  if (tags) {
    await recordUnapprovedTags(tags);
  }

  return Response.json({ ok: true, slug, revNumber: nextRev });
}
