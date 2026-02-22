CREATE TYPE "AiClientStatus" AS ENUM ('PENDING', 'ACTIVE');

ALTER TABLE "AiClient"
ADD COLUMN "status" "AiClientStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "pairCodeHash" TEXT,
ADD COLUMN "pairCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN "ownerConfirmedAt" TIMESTAMP(3);

CREATE INDEX "AiClient_ownerUserId_status_idx"
ON "AiClient"("ownerUserId", "status");

CREATE INDEX "AiClient_status_createdAt_idx"
ON "AiClient"("status", "createdAt");
