-- CreateTable
CREATE TABLE "DocumentSource" (
    "documentId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentSource_pkey" PRIMARY KEY ("documentId","sourceId")
);

-- CreateIndex
CREATE INDEX "DocumentSource_sourceId_idx" ON "DocumentSource"("sourceId");

-- AddForeignKey
ALTER TABLE "DocumentSource" ADD CONSTRAINT "DocumentSource_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSource" ADD CONSTRAINT "DocumentSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ResearchSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
