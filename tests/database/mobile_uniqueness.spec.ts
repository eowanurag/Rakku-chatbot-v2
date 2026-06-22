import { getPrisma, cleanupDatabase, disconnectPrisma } from '../helpers/prisma-test-helper';

const prisma = getPrisma();

describe('Mobile Uniqueness', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });
  

  it('should prevent inserting duplicate mobile numbers', async () => {
    // Generate a random mobile number to avoid conflicts with real data
    const randomMobile = '9' + Math.floor(100000000 + Math.random() * 900000000).toString();

    // First insert should succeed
    const citizen1 = await prisma.citizen.create({
      data: {
        fullName: 'Test User 1',
        mobileNumber: randomMobile
      }
    });

    // Second insert with the same mobile number should fail
    let errorCaught = false;
    try {
      await prisma.citizen.create({
        data: {
          fullName: 'Test User 2',
          mobileNumber: randomMobile
        }
      });
    } catch (e: any) {
      errorCaught = true;
      expect(e.code).toBe('P2002'); // Prisma unique constraint violation code
    }

    expect(errorCaught).toBe(true);

    // Clean up
    await prisma.citizen.delete({ where: { id: citizen1.id } });
  });
});
