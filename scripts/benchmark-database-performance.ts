import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { registerTimeoutGuard } from './utils/timeout-guard';

const prisma = new PrismaClient();

async function measureQuery(fn: () => Promise<any>): Promise<number> {
  const start = process.hrtime.bigint();
  await fn();
  const end = process.hrtime.bigint();
  return Number(end - start) / 1e6; // Convert nanoseconds to milliseconds
}

async function main() {
  registerTimeoutGuard(120000, async () => {
    await prisma.$disconnect();
  });

  console.log('Starting Database Benchmark...');
  
  // Warm up connection
  await prisma.$queryRaw`SELECT 1`;

  const iterations = 50;
  let totalCitizenMs = 0;
  let totalWorkflowMs = 0;
  let totalComplaintMs = 0;
  let slowQueries: string[] = [];

  for (let i = 0; i < iterations; i++) {
    // 1. Citizen lookup by mobile
    const citizenMs = await measureQuery(async () => {
      await prisma.citizen.findUnique({
        where: { mobileNumber: '9999999999' }
      }).catch(() => null);
    });
    totalCitizenMs += citizenMs;
    if (citizenMs > 100) slowQueries.push(`Citizen lookup took ${citizenMs}ms`);

    // 2. Workflow session lookup
    const workflowMs = await measureQuery(async () => {
      await prisma.workflowSession.findFirst({
        where: { citizenId: 'dummy', serviceType: 'COMPLAINT', isCompleted: false }
      }).catch(() => null);
    });
    totalWorkflowMs += workflowMs;
    if (workflowMs > 100) slowQueries.push(`Workflow session lookup took ${workflowMs}ms`);

    // 3. Complaint lookup
    const complaintMs = await measureQuery(async () => {
      await prisma.complaint.findFirst({
        where: { citizenId: 'dummy', status: { notIn: ['COMPLETED', 'CLOSED'] } }
      }).catch(() => null);
    });
    totalComplaintMs += complaintMs;
    if (complaintMs > 100) slowQueries.push(`Complaint lookup took ${complaintMs}ms`);

    // 4. Draft lookup
    await measureQuery(async () => {
      await prisma.workflowSession.findFirst({
        where: { citizenId: 'dummy', currentStep: 'DRAFT' }
      }).catch(() => null);
    });
  }

  const report = {
    avgCitizenLookupMs: totalCitizenMs / iterations,
    avgWorkflowResumeMs: totalWorkflowMs / iterations,
    avgComplaintLookupMs: totalComplaintMs / iterations,
    slowQueries,
    executedAt: new Date().toISOString()
  };

  const reportsDir = path.resolve(__dirname, '../storage/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(reportsDir, 'database-performance-report.json'),
    JSON.stringify(report, null, 2),
    'utf8'
  );

  console.log('Database Benchmark finished:', report);
  console.log('__BENCHMARK_DONE__');
}

main()
  .catch(err => {
    console.error('Benchmark failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
