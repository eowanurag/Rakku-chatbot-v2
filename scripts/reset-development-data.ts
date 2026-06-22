import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting development database reset...');

  const tables = [
    'Citizen',
    'Complaint',
    'Verification',
    'CharacterCertificate',
    'EventPermission',
    'ChatHistory',
    'WorkflowSession',
    'AuditLog',
    'TrackingRecord',
    'ConversationInsight',
    'ConversationSentiment',
    'UnansweredQuestion',
    'LearningEvent',
    'AggregatedMetric',
    'CitizenFeedback',
    'SubmissionFingerprint',
    'IntentClassification',
    'SituationAssessmentSession',
    'ComplaintSession',
    'ComplaintAssessment',
    'ScenarioSession',
    'ScenarioAssessment',
    'UnderstandingCandidate',
    'UnderstandingReviewQueue',
    'CueReplayResult',
    'Notification',
    'CitizenPreference'
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
      console.log(`Truncated table ${table}`);
    } catch (e: any) {
      console.warn(`Failed to truncate ${table}: ${e.message}`);
    }
  }

  // Reset sequences/identities and run analyze
  console.log('Running ANALYZE...');
  try {
    await prisma.$executeRawUnsafe('ANALYZE;');
    console.log('ANALYZE completed.');
  } catch (e: any) {
    console.warn(`ANALYZE failed or not supported in this connection: ${e.message}`);
  }

  console.log('Running REINDEX TABLE...');
  for (const table of ['Citizen', 'WorkflowSession', 'Complaint', 'Verification', 'CharacterCertificate']) {
    try {
      await prisma.$executeRawUnsafe(`REINDEX TABLE "${table}";`);
      console.log(`Reindexed table ${table}`);
    } catch (e: any) {
      console.warn(`REINDEX TABLE "${table}" failed: ${e.message}`);
    }
  }

  console.log('Database reset successfully.');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
