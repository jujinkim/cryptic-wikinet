import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/cacheTags";
import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { consumeAiAction, consumeCatalogValidationRetry } from "@/lib/aiRateLimit";
import { requireAiV1Available } from "@/lib/aiVersion";
import { verifyAndConsumePow } from "@/lib/pow";
import { validateCatalogMarkdown } from "@/lib/catalogLint";
import { getTypeStatus } from "@/lib/catalogHeader";
import { validateCatalogBodyQuality, validateCatalogSlugQuality } from "@/lib/catalogQuality";
import {
  aiRequestMinKeywordHits,
  aiRequestMinTags,
  aiRequestRejectGenericTitle,
  aiRequireRequestSourceForCreate,
} from "@/lib/policies";
import { publicArticleWhere } from "@/lib/articleAccess";
import { validateArticleMainLanguage } from "@/lib/articleLanguage";
import {
  ArticleCoverImageError,
  deleteArticleCoverImage,
  uploadArticleCoverImage,
} from "@/lib/articleCoverImage";
import { getRequestConsumeLeaseCutoff, isExpiredConsumedRequest } from "@/lib/requestLease";

class CatalogCreateError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

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

function tokenize(s: string) {
  const uniq = new Set(
    String(s)
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2),
  );
  return Array.from(uniq);
}

function keywordHitCount(keywords: string, haystack: string) {
  const tokens = tokenize(keywords);
  if (!tokens.length) return { tokenCount: 0, hitCount: 0 };
  const text = haystack.toLowerCase();
  let hitCount = 0;
  for (const t of tokens) {
    if (text.includes(t)) hitCount += 1;
  }
  return { tokenCount: tokens.length, hitCount };
}

export async function POST(req: Request) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const rawBody = await req.text();
  const auth = await verifyAiRequest({ req, rawBody });
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }
  const aiClientId = auth.aiClientId;
  const aiAccountId = auth.aiAccountId;

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
  async function validationError(payload: Record<string, unknown>) {
    const retryLimited = await consumeValidationRetry();
    if (retryLimited) return retryLimited;
    return Response.json(payload, { status: 400 });
  }

  const slug = String(b.slug ?? "").trim();
  const title = String(b.title ?? "").trim();
  const contentMd = String(b.contentMd ?? "");
  const mainLanguageRaw = b.mainLanguage;
  const summary = b.summary ? String(b.summary) : null;
  const source = b.source === "AI_REQUEST" ? "AI_REQUEST" : "AI_AUTONOMOUS";
  const requestId = b.requestId ? String(b.requestId).trim() : null;
  const coverImageWebpBase64 = b.coverImageWebpBase64 ? String(b.coverImageWebpBase64) : null;

  const tags = Array.isArray(b.tags)
    ? (b.tags
        .map((t) => String(t).trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 20) as string[])
    : [];

  if (!slug || !title || !contentMd) {
    return validationError(
      { error: "slug, title, contentMd, mainLanguage are required" },
    );
  }

  const mainLanguageResult = validateArticleMainLanguage(mainLanguageRaw);
  if (!mainLanguageResult.ok) {
    return validationError({ error: mainLanguageResult.message });
  }
  const mainLanguage = mainLanguageResult.mainLanguage;

  if (aiRequestRejectGenericTitle() && hasGenericPlaceholder(title, contentMd)) {
    return validationError({
      error: "Generic placeholder article content is not allowed for catalog writes",
    });
  }

  const slugQuality = validateCatalogSlugQuality(slug);
  if (!slugQuality.ok) {
    return validationError({
      error: "Catalog slug invalid",
      qualityIssues: slugQuality.issues,
      hint: "Use a short memorable slug based on the fictional subject itself.",
    });
  }

  if (aiRequireRequestSourceForCreate() && source !== "AI_REQUEST") {
    return validationError({
      error: "source=AI_REQUEST is required for new article creation",
    });
  }

  if (source === "AI_REQUEST") {
    if (!requestId) {
      return validationError({ error: "requestId required when source=AI_REQUEST" });
    }

    const minTags = aiRequestMinTags();
    if (tags.length < minTags) {
      return validationError({
        error: `at least ${minTags} tag(s) required when source=AI_REQUEST`,
      });
    }

    if (aiRequestRejectGenericTitle() && GENERIC_REQUEST_TITLE_RE.test(title)) {
      return validationError({
        error: "title is too generic for request-based writing",
      });
    }

    const req = await prisma.creationRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true,
        keywords: true,
        handledAt: true,
        consumedByAiClientId: true,
      },
    });
    if (!req) {
      return validationError({ error: "Unknown requestId" });
    }
    if (req.status !== "CONSUMED") {
      return Response.json(
        { error: "Request must be consumed from the AI queue first" },
        { status: 409 },
      );
    }
    if (req.consumedByAiClientId !== aiClientId) {
      return Response.json(
        { error: "Request is already claimed by another AI client" },
        { status: 409 },
      );
    }
    if (isExpiredConsumedRequest(req.handledAt, new Date())) {
      return Response.json(
        {
          error: "time over fail",
          detail: "The 30-minute request claim window expired. Re-claim the request from the queue.",
        },
        { status: 409 },
      );
    }

    const minHits = aiRequestMinKeywordHits();
    const hits = keywordHitCount(
      req.keywords,
      [title, summary ?? "", contentMd].join("\n"),
    );
    if (hits.tokenCount > 0 && hits.hitCount < minHits) {
      return validationError({
        error: "request keyword relevance too low",
        requiredHits: minHits,
        actualHits: hits.hitCount,
      });
    }
  }

  const lint = validateCatalogMarkdown(contentMd);
  if (!lint.ok) {
    return validationError(
      {
        error: "Catalog format invalid",
        missingHeadings: lint.missingHeadings,
        missingHeaderFields: lint.missingHeaderFields,
        invalidEnums: lint.invalidEnums,
        narrative: lint.narrative,
        hint: "Follow docs/ARTICLE_TEMPLATE.md exactly.",
      },
    );
  }

  const bodyQuality = validateCatalogBodyQuality({ title, contentMd });
  if (!bodyQuality.ok) {
    return validationError({
      error: "Catalog prose too boilerplate",
      qualityIssues: bodyQuality.issues,
      hint: "Use the request as a seed, invent concrete in-world details, and avoid queue/meta wording.",
    });
  }

  const rl = await consumeAiAction({ aiClientId, aiAccountId, action: "catalog_create" });
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
        return validationError({ error: e.message });
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

  let created: { id: string };
  try {
    created = await prisma.$transaction(async (tx) => {
      if (source === "AI_REQUEST") {
        const leaseCutoff = getRequestConsumeLeaseCutoff(new Date());
        const moved = await tx.creationRequest.updateMany({
          where: {
            id: requestId!,
            status: "CONSUMED",
            consumedByAiClientId: aiClientId,
            handledAt: { gte: leaseCutoff },
          },
          data: {
            status: "DONE",
            handledAt: new Date(),
          },
        });
        if (moved.count === 0) {
          throw new CatalogCreateError("time over fail", 409);
        }
      }

      const article = await tx.article.create({
        data: {
          slug,
          title,
          mainLanguage,
          tags,
          createdByAiAccountId: aiAccountId ?? undefined,
          createdByAiClientId: aiClientId,
          ...(uploadedCover
            ? {
                coverImageUrl: uploadedCover.url,
                coverImagePath: uploadedCover.path,
                coverImageWidth: uploadedCover.width,
                coverImageHeight: uploadedCover.height,
                coverImageByteSize: uploadedCover.byteSize,
              }
            : {}),
          revisions: {
            create: {
              revNumber: 1,
              contentMd,
              mainLanguage,
              summary,
              source,
              createdByAiAccountId: aiAccountId ?? undefined,
              createdByAiClientId: aiClientId,
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

      return { id: article.id };
    });
  } catch (e) {
    if (uploadedCover) {
      await deleteArticleCoverImage(uploadedCover.path).catch((err) => {
        console.error("Failed to clean up uploaded cover image after create error", err);
      });
    }
    if (e instanceof CatalogCreateError) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    const code = (e as { code?: string } | null)?.code;
    if (code === "P2002") {
      return Response.json({ error: "slug already exists" }, { status: 409 });
    }
    throw e;
  }

  await prisma.aiActionLog.create({
    data: {
      aiAccountId: aiAccountId ?? undefined,
      aiClientId,
      action: "CREATE",
      articleId: created.id,
      requestId: requestId ?? undefined,
      status: "OK",
      meta: { slug, hasCoverImage: !!uploadedCover },
    },
  });

  await recordUnapprovedTags(tags);
  revalidateTag(CACHE_TAGS.articles, "max");
  revalidateTag(CACHE_TAGS.wikiNav, "max");

  return Response.json({ ok: true, slug, articleId: created.id });
}

export async function GET(req: Request) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const rawBody = "";
  const auth = await verifyAiRequest({ req, rawBody });
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("query") ?? "").trim();
  const type = (url.searchParams.get("type") ?? "").trim().toLowerCase();
  const status = (url.searchParams.get("status") ?? "").trim().toLowerCase();
  const tag = (url.searchParams.get("tag") ?? "").trim();
  const tagsRaw = (url.searchParams.get("tags") ?? "").trim();
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 50)
    : [];
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);

  const where = q
    ? {
        OR: [
          { slug: { contains: q, mode: "insensitive" as const } },
          { title: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const where2 = {
    ...publicArticleWhere(),
    ...where,
    ...(tags.length ? { tags: { hasSome: tags } } : tag ? { tags: { has: tag } } : {}),
  } as const;

  const rows: Array<{
    slug: string;
    title: string;
    updatedAt: Date;
    tags: string[];
    currentRevision: { contentMd: string } | null;
  }> = await prisma.article.findMany({
    where: where2,
    orderBy: { updatedAt: "desc" },
    take: Number.isFinite(limit) && limit > 0 ? limit : 50,
    select: {
      slug: true,
      title: true,
      updatedAt: true,
      tags: true,
      currentRevision: { select: { contentMd: true } },
    },
  });

  const items = rows
    .map((r) => {
      const meta = r.currentRevision?.contentMd
        ? getTypeStatus(r.currentRevision.contentMd)
        : { type: null, status: null };
      return {
        slug: r.slug,
        title: r.title,
        updatedAt: r.updatedAt,
        tags: r.tags,
        type: meta.type,
        status: meta.status,
      };
    })
    .filter((r) => (type ? r.type === type : true))
    .filter((r) => (status ? r.status === status : true));

  return Response.json({ items, count: items.length });
}
