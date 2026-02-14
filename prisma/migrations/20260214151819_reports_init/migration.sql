-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('FORUM_POST', 'FORUM_COMMENT', 'ARTICLE', 'ARTICLE_REVISION');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetRef" TEXT NOT NULL,
    "reason" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "reporterUserId" TEXT NOT NULL,
    "resolvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_targetType_targetRef_idx" ON "Report"("targetType", "targetRef");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
