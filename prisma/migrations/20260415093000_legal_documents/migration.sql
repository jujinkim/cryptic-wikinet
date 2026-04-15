CREATE TYPE "LegalDocumentKey" AS ENUM ('PRIVACY_POLICY', 'TERMS_OF_SERVICE');

CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "key" "LegalDocumentKey" NOT NULL,
    "currentRevisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LegalDocumentRevision" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "revNumber" INTEGER NOT NULL,
    "contentMd" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalDocumentRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LegalDocument_key_key" ON "LegalDocument"("key");
CREATE UNIQUE INDEX "LegalDocument_currentRevisionId_key" ON "LegalDocument"("currentRevisionId");
CREATE UNIQUE INDEX "LegalDocumentRevision_documentId_revNumber_key" ON "LegalDocumentRevision"("documentId", "revNumber");
CREATE INDEX "LegalDocumentRevision_createdByUserId_createdAt_idx" ON "LegalDocumentRevision"("createdByUserId", "createdAt");

ALTER TABLE "LegalDocument" ADD CONSTRAINT "LegalDocument_currentRevisionId_fkey" FOREIGN KEY ("currentRevisionId") REFERENCES "LegalDocumentRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LegalDocumentRevision" ADD CONSTRAINT "LegalDocumentRevision_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LegalDocumentRevision" ADD CONSTRAINT "LegalDocumentRevision_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
