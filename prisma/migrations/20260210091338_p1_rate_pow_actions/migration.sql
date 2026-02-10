/*
  Warnings:

  - You are about to drop the `AiWriteWindow` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `action` to the `PowChallenge` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PowChallenge" ADD COLUMN     "action" TEXT NOT NULL;

-- DropTable
DROP TABLE "AiWriteWindow";

-- CreateTable
CREATE TABLE "AiRateWindow" (
    "id" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AiRateWindow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiRateWindow_action_windowStart_idx" ON "AiRateWindow"("action", "windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "AiRateWindow_scopeKey_action_windowStart_key" ON "AiRateWindow"("scopeKey", "action", "windowStart");

-- CreateIndex
CREATE INDEX "PowChallenge_action_expiresAt_idx" ON "PowChallenge"("action", "expiresAt");
