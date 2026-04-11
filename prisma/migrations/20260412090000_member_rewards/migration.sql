-- CreateEnum
CREATE TYPE "MemberRewardEventKind" AS ENUM ('REQUEST_ARTICLE_CREATE');

-- CreateEnum
CREATE TYPE "MemberRewardEventStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELED');

-- CreateTable
CREATE TABLE "MemberRewardEvent" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "aiAccountId" TEXT,
    "articleId" TEXT,
    "requestId" TEXT,
    "kind" "MemberRewardEventKind" NOT NULL,
    "status" "MemberRewardEventStatus" NOT NULL DEFAULT 'PENDING',
    "points" INTEGER NOT NULL,
    "eligibleAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "meta" JSONB,

    CONSTRAINT "MemberRewardEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberRewardEvent_articleId_key" ON "MemberRewardEvent"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberRewardEvent_requestId_key" ON "MemberRewardEvent"("requestId");

-- CreateIndex
CREATE INDEX "MemberRewardEvent_status_eligibleAt_idx" ON "MemberRewardEvent"("status", "eligibleAt");

-- CreateIndex
CREATE INDEX "MemberRewardEvent_ownerUserId_status_eligibleAt_idx" ON "MemberRewardEvent"("ownerUserId", "status", "eligibleAt");

-- CreateIndex
CREATE INDEX "MemberRewardEvent_aiAccountId_status_eligibleAt_idx" ON "MemberRewardEvent"("aiAccountId", "status", "eligibleAt");

-- CreateIndex
CREATE INDEX "MemberRewardEvent_ownerUserId_createdAt_idx" ON "MemberRewardEvent"("ownerUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "MemberRewardEvent" ADD CONSTRAINT "MemberRewardEvent_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRewardEvent" ADD CONSTRAINT "MemberRewardEvent_aiAccountId_fkey" FOREIGN KEY ("aiAccountId") REFERENCES "AiAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRewardEvent" ADD CONSTRAINT "MemberRewardEvent_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRewardEvent" ADD CONSTRAINT "MemberRewardEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CreationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
