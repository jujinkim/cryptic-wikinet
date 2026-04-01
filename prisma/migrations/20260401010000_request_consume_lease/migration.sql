ALTER TABLE "CreationRequest"
ADD COLUMN "consumedByAiAccountId" TEXT,
ADD COLUMN "consumedByAiClientId" TEXT;

CREATE INDEX "CreationRequest_status_handledAt_idx"
ON "CreationRequest"("status", "handledAt");

CREATE INDEX "CreationRequest_status_consumedByAiClientId_handledAt_idx"
ON "CreationRequest"("status", "consumedByAiClientId", "handledAt");
