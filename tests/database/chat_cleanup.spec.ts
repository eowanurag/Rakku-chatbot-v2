import { getPrisma, cleanupDatabase, disconnectPrisma } from '../helpers/prisma-test-helper';

const prisma = getPrisma();

describe('Chat Cleanup', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });
  

  it('should not have any chats older than 90 days', async () => {
    const expiredChatsResult: any[] = await prisma.$queryRaw`
      SELECT count(*) FROM "ChatHistory" WHERE "createdAt" < NOW() - INTERVAL '90 days'
    `;
    const count = Number(expiredChatsResult[0].count || 0);
    expect(count).toBe(0);
  });
});
