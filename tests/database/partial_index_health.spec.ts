import { getPrisma, cleanupDatabase, disconnectPrisma } from '../helpers/prisma-test-helper';

const prisma = getPrisma();

describe('Partial Index Health', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });
  

  it('should have partial indexes', async () => {
    const indexes: any[] = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
    `;

    const existingIndexNames = indexes.map(idx => idx.indexname);
    
    expect(existingIndexNames).toContain('idx_active_workflows');
    expect(existingIndexNames).toContain('idx_open_complaints');
  });
});
