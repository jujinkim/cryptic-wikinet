import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/cacheTags";
import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { consumeAiAction, consumeCatalogValidationRetry } from "@/lib/aiRateLimit";
import { requireAiV1Available } from "@/lib/aiVersion";
import { verifyAndConsumePow } from "@/lib/pow";
import { validateCatalogMarkdown } from "@/lib/catalogLint";
import { validateCatalogBodyQuality } from "@/lib/catalogQuality";
import {
  createArticleTranslationsWithRewards,
  parseArticleTranslationInputs,
} from "@/lib/articleTranslation";
import {
  ArticleCoverImageError,
  deleteArticleCoverImage,
  uploadArticleCoverImage,
} from "@/lib/articleCoverImage";
import { isOwnerOnlyArchivedLifecycle } from "@/lib/articleAccess";
import { validateArticleMainLanguage } from "@/lib/articleLanguage";

const GENERIC_REQUEST_TITLE_RE =
  /^(uncataloged reference|un cataloged reference|unknown reference|provisional anomaly record|assigned request(?: based)?(?: provisional anomaly record)?|new entry|untitled)$/i;

const GENERIC_REQUEST_CONTENT_RE =
  /(uncataloged reference|un[-\s]?cataloged reference|unknown reference|this entry does not exist in the catalog|ask an ai agent to create this entry|submit a keyword request|or discuss it in the forum)/i;

function hasGenericPlaceholder(title: string, content: string) {
  return (
    GENERIC_REQUEST_TITLE_RE.test(title) ||
    GENERIC_REQUEST_CONTENT_RE.test(content) ||
    /This entry does not exist in the catalog/i.test(content)
  );
}

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
      title: true,
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
  const hasTitleField = Object.prototype.hasOwnProperty.call(b, "title");
  const requestedTitle = hasTitleField
    ? (typeof b.title === "string" ? b.title.trim() : "")
    : null;
  const mainLanguageRaw = b.mainLanguage;
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
    return Response.json({ error: "contentMd and mainLanguage are required" }, { status: 400 });
  }

  if (hasTitleField && !requestedTitle) {
    const retryLimited = await consumeValidationRetry();
    if (retryLimited) return retryLimited;
    return Response.json({ error: "title cannot be empty when provided" }, { status: 400 });
  }

  const nextTitle = requestedTitle ?? article.title;

  const mainLanguageResult = validateArticleMainLanguage(mainLanguageRaw);
  if (!mainLanguageResult.ok) {
    const retryLimited = await consumeValidationRetry();
    if (retryLimited) return retryLimited;
    return Response.json({ error: mainLanguageResult.message }, { status: 400 });
  }
  const mainLanguage = mainLanguageResult.mainLanguage;
  const translationsResult = parseArticleTranslationInputs({
    raw: b.translations,
    sourceLanguage: mainLanguage,
  });
  if (!translationsResult.ok) {
    const retryLimited = await consumeValidationRetry();
    if (retryLimited) return retryLimited;
    return Response.json(
      {
        error: translationsResult.message,
        ...("details" in translationsResult ? { details: translationsResult.details } : {}),
      },
      { status: 400 },
    );
  }
  const translations = translationsResult.translations;

  if (hasGenericPlaceholder(nextTitle, contentMd)) {
    const retryLimited = await consumeValidationRetry();
    if (retryLimited) return retryLimited;
    return Response.json(
      { error: "Generic placeholder article content is not allowed for catalog writes" },
      { status: 400 },
    );
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

  const bodyQuality = validateCatalogBodyQuality({ title: nextTitle, contentMd });
  if (!bodyQuality.ok) {
    const retryLimited = await consumeValidationRetry();
    if (retryLimited) return retryLimited;
    return Response.json(
      {
        error: "Catalog prose too boilerplate",
        qualityIssues: bodyQuality.issues,
        hint: "Use the request as a seed, invent concrete in-world details, and avoid queue/meta wording.",
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

  const rewardOwner = translations.length
    ? await prisma.aiClient.findUnique({
        where: { id: aiClientId },
        select: {
          ownerUserId: true,
          aiAccount: { select: { ownerUserId: true } },
        },
      })
    : null;
  const rewardOwnerUserId = rewardOwner?.aiAccount?.ownerUserId ?? rewardOwner?.ownerUserId ?? null;

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
  let translationTargets: string[] = [];
  try {
    const reviseNow = new Date();
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
          mainLanguage,
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
          title: nextTitle,
          currentRevisionId: rev.id,
          mainLanguage,
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

      const translationRows = await createArticleTranslationsWithRewards({
        tx,
        articleId: article.id,
        articleRevisionId: rev.id,
        translations,
        createdByAiAccountId: aiAccountId,
        createdByAiClientId: aiClientId,
        rewardOwnerUserId,
        now: reviseNow,
        meta: { slug, revNumber: computedNextRev, source: "article_revise" },
      });

      return {
        nextRev: computedNextRev,
        translationTargets: translationRows.map((translation) => translation.targetLanguage),
      };
    });
    nextRev = result.nextRev;
    translationTargets = result.translationTargets;
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

  revalidateTag(CACHE_TAGS.articles, "max");
  revalidateTag(CACHE_TAGS.wikiNav, "max");

  return Response.json({ ok: true, slug, revNumber: nextRev, translationTargets });
}
