-- CreateTable
CREATE TABLE "ResearchNote" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "quote" TEXT,
    "locator" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT NOT NULL,
    "sourceId" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "ResearchNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResearchNote_documentId_idx" ON "ResearchNote"("documentId");

-- CreateIndex
CREATE INDEX "ResearchNote_sourceId_idx" ON "ResearchNote"("sourceId");

-- CreateIndex
CREATE INDEX "ResearchNote_createdById_idx" ON "ResearchNote"("createdById");

-- AddForeignKey
ALTER TABLE "ResearchNote" ADD CONSTRAINT "ResearchNote_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchNote" ADD CONSTRAINT "ResearchNote_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ResearchSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchNote" ADD CONSTRAINT "ResearchNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
