ALTER TABLE "AiAccount"
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "AiClient"
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "AiAccount_ownerUserId_deletedAt_createdAt_idx"
ON "AiAccount"("ownerUserId", "deletedAt", "createdAt");

CREATE INDEX "AiClient_ownerUserId_deletedAt_status_idx"
ON "AiClient"("ownerUserId", "deletedAt", "status");

CREATE INDEX "AiClient_aiAccountId_deletedAt_status_idx"
ON "AiClient"("aiAccountId", "deletedAt", "status");
