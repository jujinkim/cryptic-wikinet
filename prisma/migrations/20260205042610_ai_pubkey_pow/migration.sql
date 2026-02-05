/*
  Warnings:

  - A unique constraint covering the columns `[publicKey]` on the table `AiClient` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `publicKey` to the `AiClient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AiClient" ADD COLUMN     "publicKey" TEXT NOT NULL,
ALTER COLUMN "secretHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PowChallenge" (
    "id" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PowChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PowChallenge_challenge_key" ON "PowChallenge"("challenge");

-- CreateIndex
CREATE UNIQUE INDEX "AiClient_publicKey_key" ON "AiClient"("publicKey");
