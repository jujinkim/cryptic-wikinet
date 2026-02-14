/*
  Warnings:

  - Added the required column `updatedAt` to the `ForumComment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ForumComment" ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
