import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { registerTimeoutGuard } from './utils/timeout-guard';

const prisma = new PrismaClient();

async function main() {
  registerTimeoutGuard(120000, async () => {
    await prisma.$disconnect();
  });

  const result = await prisma.$executeRaw`
    DELETE FROM "WorkflowSession"
    WHERE "updatedAt" < NOW() - INTERVAL '30 days';
  `;

  const remainingSessions = await prisma.workflowSession.count();

  const report = {
    deletedSessions: result,
    remainingSessions,
    executedAt: new Date().toISOString()
  };

  const reportsDir = path.resolve(__dirname, '../storage/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(reportsDir, 'session-cleanup-report.json'),
    JSON.stringify(report, null, 2),
    'utf8'
  );

  console.log('Session cleanup finished:', report);
  console.log('__SESSION_CLEANUP_DONE__');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
