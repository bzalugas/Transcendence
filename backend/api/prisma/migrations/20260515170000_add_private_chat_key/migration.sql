ALTER TABLE "Chat" ADD COLUMN "privateKey" TEXT;

UPDATE "Chat" AS chat
SET "privateKey" = private_pair."privateKey"
FROM (
  SELECT
    "_ChatToUser"."A" AS "chatId",
    string_agg("_ChatToUser"."B", ':' ORDER BY "_ChatToUser"."B") AS "privateKey",
    count(*) AS "participantCount"
  FROM "_ChatToUser"
  GROUP BY "_ChatToUser"."A"
) AS private_pair
WHERE chat."id" = private_pair."chatId"
  AND chat."type" = 'Private'
  AND private_pair."participantCount" = 2;

CREATE UNIQUE INDEX "Chat_privateKey_key" ON "Chat"("privateKey");
