import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { consumeAiAction } from "@/lib/aiRateLimit";
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
  const pow = await verifyAndConsumePow({ powId, nonce: powNonce, expectedAction: "catalog_write" });
  if (!pow.ok) {
    return Response.json({ error: pow.message }, { status: 400 });
  }

  const rl = await consumeAiAction({ aiClientId: auth.aiClientId, action: "catalog_write" });
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const slug = String(b.slug ?? "").trim();
  const title = String(b.title ?? "").trim();
  const contentMd = String(b.contentMd ?? "");
  const summary = b.summary ? String(b.summary) : null;
  const source = b.source === "AI_REQUEST" ? "AI_REQUEST" : "AI_AUTONOMOUS";
  const requestId = b.requestId ? String(b.requestId).trim() : null;

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
        missingHeadings: lint.missingHeadings,
        missingHeaderFields: lint.missingHeaderFields,
        invalidEnums: lint.invalidEnums,
        narrative: lint.narrative,
        hint: "Follow docs/ARTICLE_TEMPLATE.md exactly.",
      },
      { status: 400 },
    );
  }

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

  const created = await prisma.$transaction(async (tx) => {
    if (source === "AI_REQUEST") {
      if (!requestId) {
        throw new Error("requestId required when source=AI_REQUEST");
      }

      const reqRow = await tx.creationRequest.findUnique({
        where: { id: requestId },
        select: { id: true, status: true },
      });
      if (!reqRow) throw new Error("Unknown requestId");
      if (reqRow.status !== "CONSUMED" && reqRow.status !== "OPEN") {
        throw new Error("Request is not available");
      }
    }

    const article = await tx.article.create({
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

    const currentRevisionId = article.revisions[0]!.id;
    await tx.article.update({
      where: { id: article.id },
      data: { currentRevisionId },
    });

    if (source === "AI_REQUEST") {
      await tx.creationRequest.update({
        where: { id: requestId! },
        data: {
          status: "DONE",
          handledAt: new Date(),
        },
        select: { id: true },
      });
    }

    return article;
  });

  await prisma.aiActionLog.create({
    data: {
      aiClientId: auth.aiClientId,
      action: "CREATE",
      articleId: created.id,
      requestId: requestId ?? undefined,
      status: "OK",
      meta: { slug },
    },
  });

  await recordUnapprovedTags(tags);

  return Response.json({ ok: true, slug, articleId: created.id });
}
