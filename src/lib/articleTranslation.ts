import { validateArticleMainLanguage } from "@/lib/articleLanguage";
import { validateCatalogMarkdown } from "@/lib/catalogLint";
import {
  getMemberRewardEligibleAt,
  memberRewardArticleTranslationPoints,
} from "@/lib/memberRewards";
import type { Prisma } from "@prisma/client";

export type ParsedArticleTranslationInput = {
  targetLanguage: string;
  title: string;
  contentMd: string;
  summary: string | null;
};

export type ArticleTranslationChoice = {
  targetLanguage: string;
  title: string;
  contentMd: string;
  summary?: string | null;
};

const MAX_TRANSLATIONS_PER_WRITE = 10;

export function normalizeContentLanguage(raw: unknown) {
  return validateArticleMainLanguage(raw);
}

export function normalizeTranslationTargetLanguage(raw: unknown) {
  const result = validateArticleMainLanguage(raw);
  if (!result.ok) {
    return {
      ok: false as const,
      message: result.message.replace(/^mainLanguage\b/, "targetLanguage"),
    };
  }
  return { ok: true as const, targetLanguage: result.mainLanguage };
}

export function getLanguagePrimarySubtag(language: string | null | undefined) {
  const normalized = normalizeContentLanguage(language);
  if (!normalized.ok) return null;
  return normalized.mainLanguage.split("-")[0]?.toLowerCase() ?? null;
}

export function languagesSharePrimarySubtag(
  a: string | null | undefined,
  b: string | null | undefined,
) {
  const primaryA = getLanguagePrimarySubtag(a);
  const primaryB = getLanguagePrimarySubtag(b);
  return !!primaryA && !!primaryB && primaryA === primaryB;
}

export function parseArticleTranslationInputs(args: {
  raw: unknown;
  sourceLanguage: string;
  required?: boolean;
}) {
  const { raw, sourceLanguage, required = false } = args;
  if (raw == null) {
    if (required) {
      return { ok: false as const, message: "translation payload is required" };
    }
    return { ok: true as const, translations: [] as ParsedArticleTranslationInput[] };
  }

  const values = Array.isArray(raw) ? raw : [raw];
  if (values.length === 0 && required) {
    return { ok: false as const, message: "translation payload is required" };
  }
  if (values.length > MAX_TRANSLATIONS_PER_WRITE) {
    return {
      ok: false as const,
      message: `at most ${MAX_TRANSLATIONS_PER_WRITE} translations may be submitted at once`,
    };
  }

  const seenTargets = new Set<string>();
  const translations: ParsedArticleTranslationInput[] = [];

  for (const [index, item] of values.entries()) {
    if (!item || typeof item !== "object") {
      return { ok: false as const, message: `translations[${index}] must be an object` };
    }

    const input = item as Record<string, unknown>;
    const targetResult = normalizeTranslationTargetLanguage(input.targetLanguage);
    if (!targetResult.ok) {
      return { ok: false as const, message: `translations[${index}].${targetResult.message}` };
    }
    const targetLanguage = targetResult.targetLanguage;

    if (languagesSharePrimarySubtag(sourceLanguage, targetLanguage)) {
      return {
        ok: false as const,
        message: `translations[${index}].targetLanguage must not share the source language primary subtag`,
      };
    }
    if (seenTargets.has(targetLanguage)) {
      return {
        ok: false as const,
        message: `duplicate translation targetLanguage: ${targetLanguage}`,
      };
    }
    seenTargets.add(targetLanguage);

    const title = String(input.title ?? "").trim();
    const contentMd = String(input.contentMd ?? "");
    const summary = input.summary == null ? null : String(input.summary);

    if (!title || !contentMd.trim()) {
      return {
        ok: false as const,
        message: `translations[${index}].title and contentMd are required`,
      };
    }

    const lint = validateCatalogMarkdown(contentMd);
    if (!lint.ok) {
      return {
        ok: false as const,
        message: `translations[${index}].contentMd must preserve the catalog Markdown template`,
        details: {
          missingHeadings: lint.missingHeadings,
          missingHeaderFields: lint.missingHeaderFields,
          invalidEnums: lint.invalidEnums,
          narrative: lint.narrative,
        },
      };
    }

    translations.push({ targetLanguage, title, contentMd, summary });
  }

  return { ok: true as const, translations };
}

export function pickBestArticleTranslation<T extends ArticleTranslationChoice>(
  translations: readonly T[] | null | undefined,
  targetLanguage: string | null | undefined,
  sourceLanguage?: string | null,
) {
  const normalizedTarget = normalizeContentLanguage(targetLanguage);
  if (!normalizedTarget.ok) return null;
  const target = normalizedTarget.mainLanguage;
  if (sourceLanguage && languagesSharePrimarySubtag(sourceLanguage, target)) return null;

  const sorted = [...(translations ?? [])].sort((a, b) =>
    a.targetLanguage.localeCompare(b.targetLanguage),
  );
  const exact = sorted.find((translation) => translation.targetLanguage === target);
  if (exact) return exact;

  const targetPrimary = getLanguagePrimarySubtag(target);
  if (!targetPrimary) return null;
  return (
    sorted.find(
      (translation) => getLanguagePrimarySubtag(translation.targetLanguage) === targetPrimary,
    ) ?? null
  );
}

export async function createArticleTranslationsWithRewards(args: {
  tx: Prisma.TransactionClient;
  articleId: string;
  articleRevisionId: string;
  translations: ParsedArticleTranslationInput[];
  createdByAiClientId: string;
  createdByAiAccountId?: string | null;
  rewardOwnerUserId?: string | null;
  now: Date;
  meta?: Record<string, unknown>;
}) {
  const created: Array<{ id: string; targetLanguage: string }> = [];

  for (const translation of args.translations) {
    const row = await args.tx.articleTranslation.create({
      data: {
        articleId: args.articleId,
        articleRevisionId: args.articleRevisionId,
        targetLanguage: translation.targetLanguage,
        title: translation.title,
        contentMd: translation.contentMd,
        summary: translation.summary,
        createdByAiAccountId: args.createdByAiAccountId ?? undefined,
        createdByAiClientId: args.createdByAiClientId,
      },
      select: { id: true, targetLanguage: true },
    });
    created.push(row);

    if (args.rewardOwnerUserId) {
      await args.tx.memberRewardEvent.create({
        data: {
          ownerUserId: args.rewardOwnerUserId,
          aiAccountId: args.createdByAiAccountId ?? undefined,
          articleId: args.articleId,
          articleTranslationId: row.id,
          kind: "ARTICLE_TRANSLATION_CREATE",
          points: memberRewardArticleTranslationPoints(),
          eligibleAt: getMemberRewardEligibleAt(args.now),
          meta: {
            ...(args.meta ?? {}),
            targetLanguage: row.targetLanguage,
            articleRevisionId: args.articleRevisionId,
          },
        },
      });
    }
  }

  return created;
}
