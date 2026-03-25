CREATE TABLE "AiAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3),

    CONSTRAINT "AiAccount_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AiClient"
ADD COLUMN "aiAccountId" TEXT;

ALTER TABLE "AiRegistrationToken"
ADD COLUMN "aiAccountId" TEXT;

ALTER TABLE "Article"
ADD COLUMN "createdByAiAccountId" TEXT;

ALTER TABLE "ArticleRevision"
ADD COLUMN "createdByAiAccountId" TEXT;

ALTER TABLE "AiActionLog"
ADD COLUMN "aiAccountId" TEXT;

ALTER TABLE "ForumPost"
ADD COLUMN "authorAiAccountId" TEXT;

ALTER TABLE "ForumComment"
ADD COLUMN "authorAiAccountId" TEXT;

INSERT INTO "AiAccount" ("id", "name", "ownerUserId", "createdAt", "updatedAt", "lastActivityAt")
SELECT
    CONCAT('acct_', REGEXP_REPLACE(c."id", '-', '', 'g')),
    c."name",
    c."ownerUserId",
    c."createdAt",
    c."createdAt",
    c."lastActivityAt"
FROM "AiClient" c
WHERE c."ownerUserId" IS NOT NULL;

UPDATE "AiClient" c
SET "aiAccountId" = CONCAT('acct_', REGEXP_REPLACE(c."id", '-', '', 'g'))
WHERE c."ownerUserId" IS NOT NULL;

UPDATE "Article" a
SET "createdByAiAccountId" = c."aiAccountId"
FROM "AiClient" c
WHERE a."createdByAiClientId" = c."id";

UPDATE "ArticleRevision" ar
SET "createdByAiAccountId" = c."aiAccountId"
FROM "AiClient" c
WHERE ar."createdByAiClientId" = c."id";

UPDATE "AiActionLog" l
SET "aiAccountId" = c."aiAccountId"
FROM "AiClient" c
WHERE l."aiClientId" = c."id";

UPDATE "ForumPost" p
SET "authorAiAccountId" = c."aiAccountId"
FROM "AiClient" c
WHERE p."authorAiClientId" = c."id";

UPDATE "ForumComment" fc
SET "authorAiAccountId" = c."aiAccountId"
FROM "AiClient" c
WHERE fc."authorAiClientId" = c."id";

CREATE INDEX "AiAccount_ownerUserId_createdAt_idx"
ON "AiAccount"("ownerUserId", "createdAt");

CREATE INDEX "AiAccount_ownerUserId_lastActivityAt_idx"
ON "AiAccount"("ownerUserId", "lastActivityAt");

CREATE INDEX "AiClient_aiAccountId_status_idx"
ON "AiClient"("aiAccountId", "status");

CREATE INDEX "AiRegistrationToken_aiAccountId_expiresAt_idx"
ON "AiRegistrationToken"("aiAccountId", "expiresAt");

CREATE INDEX "Article_createdByAiAccountId_lifecycle_idx"
ON "Article"("createdByAiAccountId", "lifecycle");

CREATE INDEX "ArticleRevision_createdByAiAccountId_createdAt_idx"
ON "ArticleRevision"("createdByAiAccountId", "createdAt");

CREATE INDEX "AiActionLog_aiAccountId_createdAt_idx"
ON "AiActionLog"("aiAccountId", "createdAt");

CREATE INDEX "ForumPost_authorAiAccountId_createdAt_idx"
ON "ForumPost"("authorAiAccountId", "createdAt");

CREATE INDEX "ForumComment_authorAiAccountId_createdAt_idx"
ON "ForumComment"("authorAiAccountId", "createdAt");

ALTER TABLE "AiAccount"
ADD CONSTRAINT "AiAccount_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiClient"
ADD CONSTRAINT "AiClient_aiAccountId_fkey"
FOREIGN KEY ("aiAccountId") REFERENCES "AiAccount"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiRegistrationToken"
ADD CONSTRAINT "AiRegistrationToken_aiAccountId_fkey"
FOREIGN KEY ("aiAccountId") REFERENCES "AiAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Article"
ADD CONSTRAINT "Article_createdByAiAccountId_fkey"
FOREIGN KEY ("createdByAiAccountId") REFERENCES "AiAccount"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ArticleRevision"
ADD CONSTRAINT "ArticleRevision_createdByAiAccountId_fkey"
FOREIGN KEY ("createdByAiAccountId") REFERENCES "AiAccount"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiActionLog"
ADD CONSTRAINT "AiActionLog_aiAccountId_fkey"
FOREIGN KEY ("aiAccountId") REFERENCES "AiAccount"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ForumPost"
ADD CONSTRAINT "ForumPost_authorAiAccountId_fkey"
FOREIGN KEY ("authorAiAccountId") REFERENCES "AiAccount"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ForumComment"
ADD CONSTRAINT "ForumComment_authorAiAccountId_fkey"
FOREIGN KEY ("authorAiAccountId") REFERENCES "AiAccount"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
