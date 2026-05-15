ALTER TABLE "user"
  ADD COLUMN "timeoutUntil" TIMESTAMP(3),
  ADD COLUMN "bannedAt" TIMESTAMP(3),
  ADD COLUMN "moderationReason" TEXT;
