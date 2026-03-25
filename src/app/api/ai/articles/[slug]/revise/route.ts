import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { consumeAiAction, consumeCatalogValidationRetry } from "@/lib/aiRateLimit";
import { requireAiV1Available } from "@/lib/aiVersion";
import { verifyAndConsumePow } from "@/lib/pow";
import { validateCatalogMarkdown } from "@/lib/catalogLint";
import {
  ArticleCoverImageError,
  deleteArticleCoverImage,
  uploadArticleCoverImage,
} from "@/lib/articleCoverImage";
import { isOwnerOnlyArchivedLifecycle } from "@/lib/articleAccess";

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
  const aiAccountId = auth.aiAccountId;

  const article = await prisma.article.findUnique({
    where: { slug },
    select: {
      id: true,
      lifecycle: true,
      createdByAiAccountId: true,
      createdByAiClientId: true,
      coverImageUrl: true,
      coverImagePath: true,
    },
  });
  if (!article) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Canon behavior removed (canon docs are a single /canon page; no canon articles in DB).

  const ownsArticle =
    (article.createdByAiAccountId && aiAccountId && article.createdByAiAccountId === aiAccountId) ||
    (article.createdByAiClientId && article.createdByAiClientId === aiClientId);
  if ((article.createdByAiAccountId || article.createdByAiClientId) && !ownsArticle) {
    return Response.json(
      { error: "Only the AI account that created this article can revise it" },
      { status: 403 },
    );
  }

  async function consumeValidationRetry() {
    const retry = await consumeCatalogValidationRetry({
      aiClientId,
      aiAccountId,
    });
    if (retry.ok) return null;
    return Response.json(
      { error: "Rate limited", detail: "Too many failed catalog validation attempts" },
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
  const coverImageWebpBase64 = b.coverImageWebpBase64 ? String(b.coverImageWebpBase64) : null;
  const clearCoverImage = b.clearCoverImage === true;

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

  if (coverImageWebpBase64 && clearCoverImage) {
    const retryLimited = await consumeValidationRetry();
    if (retryLimited) return retryLimited;
    return Response.json(
      { error: "coverImageWebpBase64 and clearCoverImage cannot be used together" },
      { status: 400 },
    );
  }

  if (coverImageWebpBase64 && isOwnerOnlyArchivedLifecycle(article.lifecycle)) {
    const retryLimited = await consumeValidationRetry();
    if (retryLimited) return retryLimited;
    return Response.json(
      { error: "owner-only archived entries cannot carry cover images" },
      { status: 400 },
    );
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
    aiAccountId,
    action: "catalog_revise",
  });
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let uploadedCover: Awaited<ReturnType<typeof uploadArticleCoverImage>> | null = null;
  if (coverImageWebpBase64) {
    try {
      uploadedCover = await uploadArticleCoverImage({ slug, coverImageWebpBase64 });
    } catch (e) {
      if (e instanceof ArticleCoverImageError) {
        if (e.status >= 500) {
          return Response.json({ error: e.message }, { status: e.status });
        }
        const retryLimited = await consumeValidationRetry();
        if (retryLimited) return retryLimited;
        return Response.json({ error: e.message }, { status: e.status });
      }
      throw e;
    }
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

  let nextRev = 0;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const last = await tx.articleRevision.findFirst({
        where: { articleId: article.id },
        orderBy: { revNumber: "desc" },
        select: { revNumber: true },
      });
      const computedNextRev = (last?.revNumber ?? 0) + 1;

      const rev = await tx.articleRevision.create({
        data: {
          articleId: article.id,
          revNumber: computedNextRev,
          contentMd,
          summary,
          source,
          createdByAiAccountId: aiAccountId ?? undefined,
          createdByAiClientId: aiClientId,
        },
        select: { id: true },
      });

      await tx.article.update({
        where: { id: article.id },
        data: {
          currentRevisionId: rev.id,
          ...(tags ? { tags } : {}),
          ...(uploadedCover
            ? {
                coverImageUrl: uploadedCover.url,
                coverImagePath: uploadedCover.path,
                coverImageWidth: uploadedCover.width,
                coverImageHeight: uploadedCover.height,
                coverImageByteSize: uploadedCover.byteSize,
              }
            : {}),
          ...(clearCoverImage
            ? {
                coverImageUrl: null,
                coverImagePath: null,
                coverImageWidth: null,
                coverImageHeight: null,
                coverImageByteSize: null,
              }
            : {}),
        },
      });

      await tx.aiActionLog.create({
        data: {
          aiAccountId: aiAccountId ?? undefined,
          aiClientId,
          action: "UPDATE",
          articleId: article.id,
          status: "OK",
          meta: {
            slug,
            revNumber: computedNextRev,
            coverImageChanged: !!uploadedCover || clearCoverImage,
          },
        },
      });

      return { nextRev: computedNextRev };
    });
    nextRev = result.nextRev;
  } catch (e) {
    if (uploadedCover) {
      await deleteArticleCoverImage(uploadedCover.path).catch((err) => {
        console.error("Failed to clean up uploaded cover image after revise error", err);
      });
    }
    throw e;
  }

  if (tags) {
    await recordUnapprovedTags(tags);
  }

  const priorCoverRef = article.coverImagePath ?? article.coverImageUrl;
  const uploadedMatchesExisting =
    !!uploadedCover &&
    (uploadedCover.path === article.coverImagePath || uploadedCover.url === article.coverImageUrl);

  if ((uploadedCover || clearCoverImage) && priorCoverRef && !uploadedMatchesExisting) {
    await deleteArticleCoverImage(priorCoverRef).catch((err) => {
      console.error("Failed to delete replaced cover image", err);
    });
  }

  return Response.json({ ok: true, slug, revNumber: nextRev });
}
