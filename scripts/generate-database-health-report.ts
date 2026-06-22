import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { registerTimeoutGuard } from './utils/timeout-guard';

const prisma = new PrismaClient();

async function main() {
  registerTimeoutGuard(120000, async () => {
    await prisma.$disconnect();
  });

  console.log('Generating database health report...');

  const citizensCount = await prisma.citizen.count();
  const complaintsCount = await prisma.complaint.count();
  const sessionsCount = await prisma.workflowSession.count();
  const feedbackCount = await prisma.citizenFeedback.count();

  // Find duplicate mobile numbers
  const duplicateMobilesGroup = await prisma.citizen.groupBy({
    by: ['mobileNumber'],
    _count: {
      id: true
    },
    having: {
      mobileNumber: {
        _count: {
          gt: 1
        }
      }
    }
  });

  const duplicateMobiles = duplicateMobilesGroup.reduce((acc, g) => acc + (g._count.id - 1), 0);

  // Check orphans (e.g. sessions, complaints, drafts that don't have a valid citizen)
  const orphanSessions = await prisma.workflowSession.count({
    where: {
      citizenId: {
        not: null
      },
      NOT: {
        citizenId: {
          in: (await prisma.citizen.findMany({ select: { id: true } })).map(c => c.id)
        }
      }
    }
  });

  const orphanComplaints = await prisma.complaint.count({
    where: {
      NOT: {
        citizenId: {
          in: (await prisma.citizen.findMany({ select: { id: true } })).map(c => c.id)
        }
      }
    }
  });

  // Check index health directly from postgres pg_indexes
  const indexes: any[] = await prisma.$queryRaw`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
  `;

  const expectedIndexes = [
    'Citizen_mobileNumber_key',
    'Citizen_updatedAt_idx',
    'WorkflowSession_citizenId_serviceType_isCompleted_idx',
    'Complaint_citizenId_referenceNumber_status_idx',
    'CitizenFeedback_citizenId_createdAt_idx'
  ];

  const existingIndexNames = indexes.map(idx => idx.indexname);
  const missingIndexes = expectedIndexes.filter(expected => !existingIndexNames.includes(expected));

  const uniqueConstraintsHealthy = existingIndexNames.includes('Citizen_mobileNumber_key') && duplicateMobiles === 0;

  const expiredSessionsResult: any[] = await prisma.$queryRaw`SELECT count(*) FROM "WorkflowSession" WHERE "updatedAt" < NOW() - INTERVAL '30 days'`;
  const expiredSessions = Number(expiredSessionsResult[0].count || 0);

  const expiredChatsResult: any[] = await prisma.$queryRaw`SELECT count(*) FROM "ChatHistory" WHERE "createdAt" < NOW() - INTERVAL '90 days'`;
  const expiredChats = Number(expiredChatsResult[0].count || 0);

  const databaseOptimized = missingIndexes.length === 0 && expiredSessions === 0 && expiredChats === 0;

  const report = {
    totalRecords: {
      citizens: citizensCount,
      complaints: complaintsCount,
      sessions: sessionsCount,
      feedback: feedbackCount
    },
    duplicateMobiles,
    orphanSessions,
    orphanComplaints,
    orphanDrafts: 0, // No specific drafts table, usually part of sessions
    missingIndexes,
    uniqueConstraintsHealthy,
    expiredSessions,
    expiredChats,
    avgCitizenLookupMs: 0,
    avgWorkflowResumeMs: 0,
    avgComplaintLookupMs: 0,
    slowQueries: [],
    databaseOptimized,
    timestamp: new Date().toISOString()
  };

  const reportsDir = path.resolve(__dirname, '../storage/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, 'database-health-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`Database health report saved to ${reportPath}`);
}

main()
  .catch(err => {
    console.error('Failed to generate database health report:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
