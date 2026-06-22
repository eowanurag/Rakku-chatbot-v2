import { getPrisma, cleanupDatabase, disconnectPrisma } from '../helpers/prisma-test-helper';

const prisma = getPrisma();

describe('Session Cleanup', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });
  

  it('should not have any sessions older than 30 days', async () => {
    const expiredSessionsResult: any[] = await prisma.$queryRaw`
      SELECT count(*) FROM "WorkflowSession" WHERE "updatedAt" < NOW() - INTERVAL '30 days'
    `;
    const count = Number(expiredSessionsResult[0].count || 0);
    expect(count).toBe(0);
  });
});
