ALTER TABLE "Message" ADD COLUMN "encrypted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Message" ADD COLUMN "encryptionIv" TEXT;
ALTER TABLE "Message" ADD COLUMN "encryptionTag" TEXT;
