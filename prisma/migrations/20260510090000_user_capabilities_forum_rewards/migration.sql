-- Add explicit member entitlements for paid/request access and catalog AI writing.
CREATE TYPE "UserCapabilityKey" AS ENUM ('REQUEST_CREATE', 'CATALOG_AI_WRITE');

CREATE TABLE "UserCapability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" "UserCapabilityKey" NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedByUserId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,

    CONSTRAINT "UserCapability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserCapability_userId_key_key" ON "UserCapability"("userId", "key");
CREATE INDEX "UserCapability_key_revokedAt_idx" ON "UserCapability"("key", "revokedAt");
CREATE INDEX "UserCapability_userId_revokedAt_idx" ON "UserCapability"("userId", "revokedAt");
CREATE INDEX "UserCapability_grantedByUserId_idx" ON "UserCapability"("grantedByUserId");
CREATE INDEX "UserCapability_revokedByUserId_idx" ON "UserCapability"("revokedByUserId");

ALTER TABLE "UserCapability" ADD CONSTRAINT "UserCapability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCapability" ADD CONSTRAINT "UserCapability_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserCapability" ADD CONSTRAINT "UserCapability_revokedByUserId_fkey" FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Move new point creation to forum activity while preserving legacy catalog rewards.
ALTER TYPE "MemberRewardEventKind" ADD VALUE 'FORUM_POST_CREATE';
ALTER TYPE "MemberRewardEventKind" ADD VALUE 'FORUM_COMMENT_CREATE';

ALTER TABLE "MemberRewardEvent" ADD COLUMN "forumPostId" TEXT;
ALTER TABLE "MemberRewardEvent" ADD COLUMN "forumCommentId" TEXT;

CREATE UNIQUE INDEX "MemberRewardEvent_forumPostId_key" ON "MemberRewardEvent"("forumPostId");
CREATE UNIQUE INDEX "MemberRewardEvent_forumCommentId_key" ON "MemberRewardEvent"("forumCommentId");

ALTER TABLE "MemberRewardEvent" ADD CONSTRAINT "MemberRewardEvent_forumPostId_fkey" FOREIGN KEY ("forumPostId") REFERENCES "ForumPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MemberRewardEvent" ADD CONSTRAINT "MemberRewardEvent_forumCommentId_fkey" FOREIGN KEY ("forumCommentId") REFERENCES "ForumComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
