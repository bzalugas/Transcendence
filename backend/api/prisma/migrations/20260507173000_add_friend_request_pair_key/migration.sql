-- Store one canonical key for each friendship pair so both directions share one row.
ALTER TABLE "FriendRequest" ADD COLUMN "pairKey" TEXT;

-- If old duplicate rows exist, keep the most relevant one before adding the unique index.
WITH ranked_requests AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY
        LEAST("senderId"::text, "receiverId"::text),
        GREATEST("senderId"::text, "receiverId"::text)
      ORDER BY
        CASE "status"
          WHEN 'Accepted' THEN 3
          WHEN 'Pending' THEN 2
          ELSE 1
        END DESC,
        "UpdatedAt" DESC,
        "id" DESC
    ) AS row_number
  FROM "FriendRequest"
)
DELETE FROM "FriendRequest" AS request
USING ranked_requests AS ranked
WHERE request."id" = ranked."id"
  AND ranked.row_number > 1;

UPDATE "FriendRequest"
SET "pairKey" =
  LEAST("senderId"::text, "receiverId"::text) || ':' ||
  GREATEST("senderId"::text, "receiverId"::text)
WHERE "pairKey" IS NULL;

ALTER TABLE "FriendRequest" ALTER COLUMN "pairKey" SET NOT NULL;

CREATE UNIQUE INDEX "FriendRequest_pairKey_key" ON "FriendRequest"("pairKey");
