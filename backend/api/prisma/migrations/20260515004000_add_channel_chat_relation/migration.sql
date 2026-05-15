ALTER TABLE "Chat" ADD COLUMN "channelId" INTEGER;

CREATE UNIQUE INDEX "Chat_channelId_key" ON "Chat"("channelId");

ALTER TABLE "Chat"
ADD CONSTRAINT "Chat_channelId_fkey"
FOREIGN KEY ("channelId") REFERENCES "Channel"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
