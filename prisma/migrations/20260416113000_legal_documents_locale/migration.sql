ALTER TABLE "LegalDocument" ADD COLUMN "locale" TEXT;

UPDATE "LegalDocument"
SET "locale" = 'en'
WHERE "locale" IS NULL;

ALTER TABLE "LegalDocument" ALTER COLUMN "locale" SET NOT NULL;

DROP INDEX "LegalDocument_key_key";

CREATE UNIQUE INDEX "LegalDocument_key_locale_key" ON "LegalDocument"("key", "locale");
