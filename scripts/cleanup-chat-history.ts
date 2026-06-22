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
    DELETE FROM "ChatHistory"
    WHERE "createdAt" < NOW() - INTERVAL '90 days';
  `;

  const remainingChats = await prisma.chatHistory.count();

  const report = {
    deletedChats: result,
    remainingChats,
    executedAt: new Date().toISOString()
  };

  const reportsDir = path.resolve(__dirname, '../storage/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(reportsDir, 'chat-cleanup-report.json'),
    JSON.stringify(report, null, 2),
    'utf8'
  );

  console.log('Chat cleanup finished:', report);
  console.log('__CHAT_CLEANUP_DONE__');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
