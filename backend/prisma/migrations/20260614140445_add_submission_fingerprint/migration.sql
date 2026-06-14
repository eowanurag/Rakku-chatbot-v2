-- CreateTable
CREATE TABLE "SubmissionFingerprint" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "citizenId" TEXT,
    "serviceType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionFingerprint_fingerprint_key" ON "SubmissionFingerprint"("fingerprint");

-- CreateIndex
CREATE INDEX "SubmissionFingerprint_citizenId_idx" ON "SubmissionFingerprint"("citizenId");

-- CreateIndex
CREATE INDEX "SubmissionFingerprint_serviceType_idx" ON "SubmissionFingerprint"("serviceType");

-- CreateIndex
CREATE INDEX "SubmissionFingerprint_createdAt_idx" ON "SubmissionFingerprint"("createdAt");
