import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Note: In Node.js >= 11, process._getActiveHandles() and process._getActiveRequests() are available
// but undocumented. They help in debugging.

async function main() {
  const activeHandles = (process as any)._getActiveHandles ? (process as any)._getActiveHandles().length : 0;
  const activeRequests = (process as any)._getActiveRequests ? (process as any)._getActiveRequests().length : 0;
  
  const memoryUsage = process.memoryUsage();
  const memoryUsageMb = Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100;

  const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
  const prismaConnected = !!globalForPrisma.prisma;

  const report = {
    activeHandles,
    activeRequests,
    prismaConnected,
    memoryUsageMb
  };

  const reportsDir = path.resolve(__dirname, '../storage/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, 'open-handles-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('Open Handles Diagnostics:');
  console.log(JSON.stringify(report, null, 2));
}

main().catch(console.error);
