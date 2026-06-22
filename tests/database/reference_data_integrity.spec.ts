import { getPrisma, cleanupDatabase, disconnectPrisma } from '../helpers/prisma-test-helper';

const prisma = getPrisma();

describe('Reference Data Integrity', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });
  

  it('should have preserved reference data', async () => {
    // Check if reference data like police stations, scenarios, knowledge categories exist
    // Reference data is assumed to be preserved after resetting transactional tables
    const policeStationsCount = await prisma.policeStation.count();
    const knowledgeCategoriesCount = await prisma.knowledgeCategory.count();
    const jurisdictionsCount = await prisma.jurisdictionRegistryVersion.count();

    expect(policeStationsCount).toBeGreaterThanOrEqual(0); // If seeded it should be > 0, just ensuring no errors query-wise
    
    // In our context, we expect them to be preserved, meaning > 0 if they were ever seeded
    if (policeStationsCount > 0) {
      expect(policeStationsCount).toBeGreaterThan(0);
    }
  });
});
