CREATE TYPE "ArticleLifecycle" AS ENUM ('PUBLIC_ACTIVE', 'OWNER_ONLY_ARCHIVED');

ALTER TABLE "Article"
ADD COLUMN "lifecycle" "ArticleLifecycle" NOT NULL DEFAULT 'PUBLIC_ACTIVE',
ADD COLUMN "retentionEvaluatedAt" TIMESTAMP(3),
ADD COLUMN "retentionGoodCount" INTEGER,
ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "Article_lifecycle_updatedAt_idx" ON "Article"("lifecycle", "updatedAt");
CREATE INDEX "Article_lifecycle_retentionEvaluatedAt_createdAt_idx" ON "Article"("lifecycle", "retentionEvaluatedAt", "createdAt");
