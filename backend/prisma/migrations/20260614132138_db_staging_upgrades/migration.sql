/*
  Warnings:

  - Added the required column `citizenId` to the `CharacterCertificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `citizenId` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `citizenId` to the `EventPermission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `citizenId` to the `Verification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoutingTargetType" AS ENUM ('POLICE_STATION', 'CYBER_CELL', 'VERIFICATION_UNIT', 'OTHER');

-- CreateEnum
CREATE TYPE "ResolutionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'OVERRIDDEN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RoutingDecision" AS ENUM ('AUTO_ASSIGNED', 'USER_CONFIRMED', 'USER_SELECTED', 'FALLBACK_ASSIGNED');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('EXACT', 'ALIAS', 'FUZZY', 'MULTIPLE', 'NONE');

-- CreateEnum
CREATE TYPE "ResolutionSource" AS ENUM ('GPS', 'TEXT_INPUT', 'PROFILE_ADDRESS', 'EVENT_LOCATION', 'PROPERTY_ADDRESS', 'MANUAL_SELECTION');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('CITIZEN', 'OFFICER', 'SYSTEM', 'ADMIN', 'FASTAPI', 'NESTJS');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('SMS', 'WHATSAPP', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoutingContext" AS ENUM ('INCIDENT_LOCATION', 'APPLICANT_ADDRESS', 'PROPERTY_ADDRESS', 'EVENT_LOCATION', 'WORKPLACE_ADDRESS', 'OTHER');

-- CreateEnum
CREATE TYPE "ResolutionEventType" AS ENUM ('RESOLUTION_CREATED', 'AUTO_ASSIGNED', 'USER_CONFIRMED', 'USER_SELECTED', 'FALLBACK_ASSIGNED', 'OVERRIDDEN', 'EXPIRED');

-- AlterTable
ALTER TABLE "CharacterCertificate" ADD COLUMN     "citizenId" TEXT NOT NULL,
ADD COLUMN     "jurisdictionResolutionId" TEXT,
ADD COLUMN     "profileSnapshot" JSONB,
ADD COLUMN     "profileSnapshotVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "usedProfileReuse" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN     "citizenId" TEXT NOT NULL,
ADD COLUMN     "imeiNumber" TEXT,
ADD COLUMN     "jurisdictionResolutionId" TEXT,
ADD COLUMN     "mobileBrand" TEXT,
ADD COLUMN     "mobileColor" TEXT,
ADD COLUMN     "mobileModel" TEXT,
ADD COLUMN     "purchaseYear" INTEGER;

-- AlterTable
ALTER TABLE "EventPermission" ADD COLUMN     "citizenId" TEXT NOT NULL,
ADD COLUMN     "jurisdictionResolutionId" TEXT,
ADD COLUMN     "organizerAddress" TEXT,
ADD COLUMN     "organizerIsApplicant" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "organizerMobile" TEXT,
ADD COLUMN     "organizerName" TEXT,
ADD COLUMN     "profileSnapshot" JSONB,
ADD COLUMN     "profileSnapshotVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "usedProfileReuse" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Verification" ADD COLUMN     "citizenId" TEXT NOT NULL,
ADD COLUMN     "jurisdictionResolutionId" TEXT;

-- CreateTable
CREATE TABLE "Citizen" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "email" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locality" TEXT,
    "nearestPoliceStation" TEXT,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Citizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowSession" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT,
    "serviceType" TEXT,
    "currentStep" TEXT NOT NULL,
    "stateJson" JSONB NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingRecord" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "citizenId" TEXT,
    "currentStatus" TEXT NOT NULL,
    "statusHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationInsight" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "citizenId" TEXT,
    "workflowType" TEXT,
    "detectedIntent" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "language" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationSentiment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "workflowType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationSentiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "citizenId" TEXT,
    "workflowType" TEXT,
    "rating" INTEGER NOT NULL,
    "comments" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnansweredQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnansweredQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntentTrainingData" (
    "id" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "detectedIntent" TEXT NOT NULL,
    "verifiedIntent" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntentTrainingData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowAnalytics" (
    "id" TEXT NOT NULL,
    "workflowType" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "abandoned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitizenPreference" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL,
    "preferredDistrict" TEXT,
    "lastWorkflow" TEXT,
    "lastVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitizenPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "KnowledgeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregatedMetric" (
    "id" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AggregatedMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitizenFeedback" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "citizenId" TEXT,
    "workflowType" TEXT,
    "rating" INTEGER NOT NULL,
    "comments" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitizenFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoliceStation" (
    "id" TEXT NOT NULL,
    "stationCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "districtCode" TEXT NOT NULL,
    "cityCode" TEXT,
    "localityCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoliceStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JurisdictionRegistryVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JurisdictionRegistryVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JurisdictionMapping" (
    "id" TEXT NOT NULL,
    "districtCode" TEXT NOT NULL,
    "cityCode" TEXT,
    "localityCode" TEXT,
    "policeStationId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "registryVersionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JurisdictionMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JurisdictionResolution" (
    "id" TEXT NOT NULL,
    "routingTargetType" "RoutingTargetType" NOT NULL,
    "routingTargetId" TEXT NOT NULL,
    "policeStationId" TEXT,
    "serviceType" TEXT NOT NULL,
    "workflowId" TEXT,
    "routingContext" "RoutingContext" NOT NULL,
    "sourceLocation" JSONB NOT NULL,
    "resolutionSource" "ResolutionSource" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "matchType" "MatchType" NOT NULL,
    "routingDecision" "RoutingDecision" NOT NULL,
    "status" "ResolutionStatus" NOT NULL,
    "jurisdictionVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JurisdictionResolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JurisdictionResolutionHistory" (
    "id" TEXT NOT NULL,
    "jurisdictionResolutionId" TEXT NOT NULL,
    "previousStatus" "ResolutionStatus",
    "newStatus" "ResolutionStatus" NOT NULL,
    "previousStationId" TEXT,
    "newStationId" TEXT,
    "previousTargetType" "RoutingTargetType",
    "previousTargetId" TEXT,
    "newTargetType" "RoutingTargetType",
    "newTargetId" TEXT,
    "reason" TEXT,
    "actorType" "ActorType",
    "actorId" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JurisdictionResolutionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JurisdictionResolutionEvent" (
    "id" TEXT NOT NULL,
    "jurisdictionResolutionId" TEXT NOT NULL,
    "eventType" "ResolutionEventType" NOT NULL,
    "actorType" "ActorType",
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JurisdictionResolutionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "template" TEXT NOT NULL,
    "workflowType" TEXT,
    "workflowId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackingRecord_referenceNumber_key" ON "TrackingRecord"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "UnansweredQuestion_question_key" ON "UnansweredQuestion"("question");

-- CreateIndex
CREATE UNIQUE INDEX "CitizenPreference_citizenId_key" ON "CitizenPreference"("citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCategory_name_key" ON "KnowledgeCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PoliceStation_stationCode_key" ON "PoliceStation"("stationCode");

-- CreateIndex
CREATE UNIQUE INDEX "JurisdictionRegistryVersion_version_key" ON "JurisdictionRegistryVersion"("version");

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_jurisdictionResolutionId_fkey" FOREIGN KEY ("jurisdictionResolutionId") REFERENCES "JurisdictionResolution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_jurisdictionResolutionId_fkey" FOREIGN KEY ("jurisdictionResolutionId") REFERENCES "JurisdictionResolution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterCertificate" ADD CONSTRAINT "CharacterCertificate_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterCertificate" ADD CONSTRAINT "CharacterCertificate_jurisdictionResolutionId_fkey" FOREIGN KEY ("jurisdictionResolutionId") REFERENCES "JurisdictionResolution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPermission" ADD CONSTRAINT "EventPermission_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPermission" ADD CONSTRAINT "EventPermission_jurisdictionResolutionId_fkey" FOREIGN KEY ("jurisdictionResolutionId") REFERENCES "JurisdictionResolution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KnowledgeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JurisdictionMapping" ADD CONSTRAINT "JurisdictionMapping_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JurisdictionMapping" ADD CONSTRAINT "JurisdictionMapping_registryVersionId_fkey" FOREIGN KEY ("registryVersionId") REFERENCES "JurisdictionRegistryVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JurisdictionResolution" ADD CONSTRAINT "JurisdictionResolution_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JurisdictionResolutionHistory" ADD CONSTRAINT "JurisdictionResolutionHistory_jurisdictionResolutionId_fkey" FOREIGN KEY ("jurisdictionResolutionId") REFERENCES "JurisdictionResolution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JurisdictionResolutionEvent" ADD CONSTRAINT "JurisdictionResolutionEvent_jurisdictionResolutionId_fkey" FOREIGN KEY ("jurisdictionResolutionId") REFERENCES "JurisdictionResolution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
