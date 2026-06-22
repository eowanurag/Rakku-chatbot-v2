import { getPrisma, cleanupDatabase, disconnectPrisma } from '../helpers/prisma-test-helper';

const prisma = getPrisma();

describe('Prisma Connection Leak Certification', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it('should run 100 repeated queries without leaking instances', async () => {
    let successCount = 0;
    
    for (let i = 0; i < 100; i++) {
      try {
        await prisma.citizen.count();
        successCount++;
      } catch (err) {
        console.error('Query failed at iteration', i, err);
      }
    }

    expect(successCount).toBe(100);
    
    const globalForPrisma = globalThis as unknown as { prisma?: any };
    expect(globalForPrisma.prisma).toBeDefined();
    expect(globalForPrisma.prisma).toBe(prisma);
  });
});
