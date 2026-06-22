import { getPrisma, cleanupDatabase, disconnectPrisma } from '../helpers/prisma-test-helper';

const prisma = getPrisma();

describe('Database Index Health', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });
  beforeAll(async () => {
    // Wait for prisma to be ready
  });

  

  it('should have all expected indexes', async () => {
    const indexes: any[] = await prisma.$queryRaw`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
    `;

    const existingIndexNames = indexes.map(idx => idx.indexname);
    
    const expectedIndexes = [
      'Citizen_mobileNumber_key',
      'Citizen_updatedAt_idx',
      'WorkflowSession_citizenId_serviceType_isCompleted_idx',
      'Complaint_citizenId_referenceNumber_status_idx',
      'CitizenFeedback_citizenId_createdAt_idx'
    ];

    for (const expected of expectedIndexes) {
      expect(existingIndexNames).toContain(expected);
    }
  });
});
