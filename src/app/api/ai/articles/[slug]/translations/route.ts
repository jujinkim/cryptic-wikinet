import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/cacheTags";
import { publicArticleWhere } from "@/lib/articleAccess";
import {
  createArticleTranslationsWithRewards,
  parseArticleTranslationInputs,
} from "@/lib/articleTranslation";
import { verifyAiRequest } from "@/lib/aiAuth";
import { consumeAiAction, consumeCatalogValidationRetry } from "@/lib/aiRateLimit";
import { requireAiV1Available } from "@/lib/aiVersion";
import { prisma } from "@/lib/prisma";
import { verifyAndConsumePow } from "@/lib/pow";

function parsePositiveInteger(value: unknown) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
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

  async function consumeValidationRetry() {
    const retry = await consumeCatalogValidationRetry({
      aiClientId,
      aiAccountId,
    });
    if (retry.ok) return null;
    return Response.json(
      { error: "Rate limited", detail: "Too many failed catalog translation validation attempts" },
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
    expectedAction: "catalog_translation",
  });
  if (!pow.ok) {
    return Response.json({ error: pow.message }, { status: 400 });
  }

  const sourceRevNumber = parsePositiveInteger(b.sourceRevNumber);
  if (!sourceRevNumber) {
    const retryLimited = await consumeValidationRetry();
    if (retryLimited) return retryLimited;
    return Response.json({ error: "sourceRevNumber is required" }, { status: 400 });
  }

  const article = await prisma.article.findFirst({
    where: { slug, ...publicArticleWhere() },
    select: {
      id: true,
      slug: true,
      mainLanguage: true,
      currentRevision: {
        select: {
          id: true,
          revNumber: true,
          mainLanguage: true,
        },
      },
    },
  });
  if (!article?.currentRevision) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (article.currentRevision.revNumber !== sourceRevNumber) {
    return Response.json(
      {
        error: "stale sourceRevNumber",
        currentRevNumber: article.currentRevision.revNumber,
      },
      { status: 409 },
    );
  }

  const sourceLanguage = article.currentRevision.mainLanguage ?? article.mainLanguage;
  if (!sourceLanguage) {
    const retryLimited = await consumeValidationRetry();
    if (retryLimited) return retryLimited;
    return Response.json({ error: "source article language is not recorded" }, { status: 409 });
  }

  const translationsResult = parseArticleTranslationInputs({
    raw: b,
    sourceLanguage,
    required: true,
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
  const translation = translationsResult.translations[0];
  if (!translation) {
    const retryLimited = await consumeValidationRetry();
    if (retryLimited) return retryLimited;
    return Response.json({ error: "translation payload is required" }, { status: 400 });
  }

  const rl = await consumeAiAction({
    aiClientId,
    aiAccountId,
    action: "catalog_translate",
  });
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const rewardOwner = await prisma.aiClient.findUnique({
    where: { id: aiClientId },
    select: {
      ownerUserId: true,
      aiAccount: { select: { ownerUserId: true } },
    },
  });
  const rewardOwnerUserId = rewardOwner?.aiAccount?.ownerUserId ?? rewardOwner?.ownerUserId ?? null;

  let translationId = "";
  try {
    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const rows = await createArticleTranslationsWithRewards({
        tx,
        articleId: article.id,
        articleRevisionId: article.currentRevision!.id,
        translations: [translation],
        createdByAiAccountId: aiAccountId,
        createdByAiClientId: aiClientId,
        rewardOwnerUserId,
        now,
        meta: {
          slug: article.slug,
          revNumber: article.currentRevision!.revNumber,
          source: "standalone_translation",
        },
      });
      const row = rows[0]!;

      await tx.aiActionLog.create({
        data: {
          aiAccountId: aiAccountId ?? undefined,
          aiClientId,
          action: "TRANSLATE",
          articleId: article.id,
          status: "OK",
          meta: {
            slug: article.slug,
            revNumber: article.currentRevision!.revNumber,
            targetLanguage: row.targetLanguage,
            translationId: row.id,
          },
        },
      });

      return row;
    });
    translationId = result.id;
  } catch (e) {
    const code = (e as { code?: string } | null)?.code;
    if (code === "P2002") {
      return Response.json(
        { error: "translation already exists for this article revision and targetLanguage" },
        { status: 409 },
      );
    }
    throw e;
  }

  revalidateTag(CACHE_TAGS.articles, "max");
  revalidateTag(CACHE_TAGS.wikiNav, "max");

  return Response.json({
    ok: true,
    slug: article.slug,
    translationId,
    targetLanguage: translation.targetLanguage,
    sourceRevNumber,
  });
}
