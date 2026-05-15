CREATE TYPE "InterestRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "InterestRequest" (
    "id" SERIAL NOT NULL,
    "requesterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "InterestRequestStatus" NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterestRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InterestRequest_requesterId_normalizedName_key" ON "InterestRequest"("requesterId", "normalizedName");
CREATE INDEX "InterestRequest_status_requestedAt_idx" ON "InterestRequest"("status", "requestedAt");

ALTER TABLE "InterestRequest" ADD CONSTRAINT "InterestRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
