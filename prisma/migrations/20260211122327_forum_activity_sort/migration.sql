-- AlterTable
ALTER TABLE "ForumPost" ADD COLUMN     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "ForumPost_lastActivityAt_idx" ON "ForumPost"("lastActivityAt");
