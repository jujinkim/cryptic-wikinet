-- CreateTable
CREATE TABLE "ArticleFeedback" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArticleFeedback_articleId_createdAt_idx" ON "ArticleFeedback"("articleId", "createdAt");

-- CreateIndex
CREATE INDEX "ArticleFeedback_userId_createdAt_idx" ON "ArticleFeedback"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ArticleFeedback" ADD CONSTRAINT "ArticleFeedback_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleFeedback" ADD CONSTRAINT "ArticleFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill legacy rating comments into the new feedback table.
INSERT INTO "ArticleFeedback" ("id", "articleId", "userId", "content", "createdAt", "updatedAt")
SELECT
    md5(random()::text || clock_timestamp()::text || COALESCE("articleId", '') || COALESCE("userId", '')),
    "articleId",
    "userId",
    btrim("comment"),
    "createdAt",
    "createdAt"
FROM "Rating"
WHERE "comment" IS NOT NULL
  AND btrim("comment") <> '';

-- Rating comments now live in ArticleFeedback.
UPDATE "Rating"
SET "comment" = NULL
WHERE "comment" IS NOT NULL
  AND btrim("comment") <> '';
