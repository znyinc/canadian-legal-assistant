-- CreateTable
CREATE TABLE "Matter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'ON',
    "domain" TEXT NOT NULL,
    "disputeAmount" REAL,
    "classification" TEXT,
    "forumMap" TEXT,
    "pillar" TEXT,
    "pillarMatches" TEXT,
    "pillarAmbiguous" BOOLEAN,
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "legalHoldReason" TEXT,
    "retentionDays" INTEGER NOT NULL DEFAULT 60,
    "retentionReason" TEXT
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matterId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileHash" TEXT NOT NULL,
    "metadata" TEXT,
    "evidenceIndex" TEXT,
    CONSTRAINT "Evidence_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matterId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packagePath" TEXT NOT NULL,
    "packageData" TEXT NOT NULL,
    CONSTRAINT "Document_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matterId" TEXT,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "details" TEXT,
    CONSTRAINT "AuditEvent_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Matter_createdAt_idx" ON "Matter"("createdAt");

-- CreateIndex
CREATE INDEX "Matter_domain_idx" ON "Matter"("domain");

-- CreateIndex
CREATE INDEX "Evidence_matterId_idx" ON "Evidence"("matterId");

-- CreateIndex
CREATE INDEX "Evidence_createdAt_idx" ON "Evidence"("createdAt");

-- CreateIndex
CREATE INDEX "Document_matterId_idx" ON "Document"("matterId");

-- CreateIndex
CREATE INDEX "Document_packageId_idx" ON "Document"("packageId");

-- CreateIndex
CREATE INDEX "AuditEvent_timestamp_idx" ON "AuditEvent"("timestamp");

-- CreateIndex
CREATE INDEX "AuditEvent_matterId_idx" ON "AuditEvent"("matterId");

-- CreateIndex
CREATE INDEX "AuditEvent_action_idx" ON "AuditEvent"("action");
