import { getPrisma, cleanupDatabase, disconnectPrisma } from '../helpers/prisma-test-helper';

const prisma = getPrisma();

describe('Orphan Records', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });
  

  it('should not have workflow sessions with invalid citizenIds', async () => {
    const validCitizenIds = (await prisma.citizen.findMany({ select: { id: true } })).map(c => c.id);
    
    const orphanSessions = await prisma.workflowSession.count({
      where: {
        citizenId: {
          not: null
        },
        NOT: {
          citizenId: {
            in: validCitizenIds
          }
        }
      }
    });

    expect(orphanSessions).toBe(0);
  });

  it('should not have complaints with invalid citizenIds', async () => {
    const validCitizenIds = (await prisma.citizen.findMany({ select: { id: true } })).map(c => c.id);
    
    const orphanComplaints = await prisma.complaint.count({
      where: {
        NOT: {
          citizenId: {
            in: validCitizenIds
          }
        }
      }
    });

    expect(orphanComplaints).toBe(0);
  });
});
