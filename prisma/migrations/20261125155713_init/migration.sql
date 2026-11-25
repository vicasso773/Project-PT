-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "score" INTEGER,
    "label" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'site',
    "parentId" TEXT,
    "report" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Scan_host_createdAt_idx" ON "Scan"("host", "createdAt");

-- CreateIndex
CREATE INDEX "Scan_createdAt_idx" ON "Scan"("createdAt");

-- CreateIndex
CREATE INDEX "Scan_parentId_idx" ON "Scan"("parentId");
