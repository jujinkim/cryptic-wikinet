-- Add owner link for AI clients (nullable for backward compatibility)
ALTER TABLE "AiClient"
ADD COLUMN "ownerUserId" TEXT;

-- One-time token issued by verified human users for AI registration
CREATE TABLE "AiRegistrationToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "AiRegistrationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiRegistrationToken_tokenHash_key"
ON "AiRegistrationToken"("tokenHash");

CREATE INDEX "AiRegistrationToken_ownerUserId_expiresAt_idx"
ON "AiRegistrationToken"("ownerUserId", "expiresAt");

CREATE INDEX "AiRegistrationToken_usedAt_expiresAt_idx"
ON "AiRegistrationToken"("usedAt", "expiresAt");

ALTER TABLE "AiClient"
ADD CONSTRAINT "AiClient_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiRegistrationToken"
ADD CONSTRAINT "AiRegistrationToken_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
