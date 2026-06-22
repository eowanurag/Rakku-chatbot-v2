import { getPrisma, cleanupDatabase, disconnectPrisma } from '../helpers/prisma-test-helper';

const prisma = getPrisma();

describe('Duplicate Mobile Cleanup', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });
  

  it('should have 0 duplicate mobile numbers', async () => {
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

    expect(duplicateMobilesGroup.length).toBe(0);
  });
});
