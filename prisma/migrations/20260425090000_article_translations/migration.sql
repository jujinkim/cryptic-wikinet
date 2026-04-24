-- Extend AI action/reward enums for catalog translation work.
ALTER TYPE "AiAction" ADD VALUE 'TRANSLATE';
ALTER TYPE "MemberRewardEventKind" ADD VALUE 'ARTICLE_TRANSLATION_CREATE';

-- Catalog translations are submitted by external AI clients and pinned to
-- the exact source revision they translate.
CREATE TABLE "ArticleTranslation" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "articleRevisionId" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentMd" TEXT NOT NULL,
    "summary" TEXT,
    "createdByAiAccountId" TEXT,
    "createdByAiClientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleTranslation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ArticleTranslation_articleRevisionId_targetLanguage_key" ON "ArticleTranslation"("articleRevisionId", "targetLanguage");
CREATE INDEX "ArticleTranslation_articleId_targetLanguage_idx" ON "ArticleTranslation"("articleId", "targetLanguage");
CREATE INDEX "ArticleTranslation_createdByAiAccountId_createdAt_idx" ON "ArticleTranslation"("createdByAiAccountId", "createdAt");
CREATE INDEX "ArticleTranslation_createdByAiClientId_createdAt_idx" ON "ArticleTranslation"("createdByAiClientId", "createdAt");

ALTER TABLE "ArticleTranslation" ADD CONSTRAINT "ArticleTranslation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleTranslation" ADD CONSTRAINT "ArticleTranslation_articleRevisionId_fkey" FOREIGN KEY ("articleRevisionId") REFERENCES "ArticleRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleTranslation" ADD CONSTRAINT "ArticleTranslation_createdByAiAccountId_fkey" FOREIGN KEY ("createdByAiAccountId") REFERENCES "AiAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArticleTranslation" ADD CONSTRAINT "ArticleTranslation_createdByAiClientId_fkey" FOREIGN KEY ("createdByAiClientId") REFERENCES "AiClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Article-level reward uniqueness only allowed one event per article. Keep
-- request uniqueness, but allow separate translation rewards for the same article.
DROP INDEX "MemberRewardEvent_articleId_key";
ALTER TABLE "MemberRewardEvent" ADD COLUMN "articleTranslationId" TEXT;
CREATE UNIQUE INDEX "MemberRewardEvent_articleTranslationId_key" ON "MemberRewardEvent"("articleTranslationId");
CREATE INDEX "MemberRewardEvent_articleId_idx" ON "MemberRewardEvent"("articleId");
ALTER TABLE "MemberRewardEvent" ADD CONSTRAINT "MemberRewardEvent_articleTranslationId_fkey" FOREIGN KEY ("articleTranslationId") REFERENCES "ArticleTranslation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
