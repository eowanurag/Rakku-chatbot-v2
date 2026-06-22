import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }

  return globalForPrisma.prisma;
}

export async function disconnectPrisma() {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }
}

export async function cleanupDatabase(): Promise<void> {
  const client = getPrisma();
  // Depending on your requirements, cleanup logic could be a full TRUNCATE
  // or targeted deletes. Example of cleaning up common tables:
  await client.workflowSession.deleteMany({});
  await client.complaint.deleteMany({});
  await client.citizenFeedback.deleteMany({});
  await client.citizen.deleteMany({});
}
