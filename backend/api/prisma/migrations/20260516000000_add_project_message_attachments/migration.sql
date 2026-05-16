ALTER TABLE "Attachment" ADD COLUMN "projectMessageId" INTEGER;

ALTER TABLE "Attachment"
ADD CONSTRAINT "Attachment_projectMessageId_fkey"
FOREIGN KEY ("projectMessageId") REFERENCES "ProjectMessage"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Attachment_projectMessageId_idx" ON "Attachment"("projectMessageId");
