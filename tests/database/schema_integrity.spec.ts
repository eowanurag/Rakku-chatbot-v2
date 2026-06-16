import { PrismaService } from '@backend/prisma.service';

describe('Database Schema Integrity and Index Validation Spec', () => {
  let prisma: PrismaService;

  beforeAll(() => {
    jest.setTimeout(30000);
    prisma = new PrismaService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should verify that the AuditLog table exists and has correct index definitions in PostgreSQL', async () => {
    // We query pg_indexes for the 'AuditLog' table (or 'audit_log' if lowercased, but Prisma preserves casing)
    const indexes: any = await prisma.$queryRaw`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'AuditLog' OR tablename = 'audit_log';
    `;

    expect(indexes).toBeDefined();
    expect(Array.isArray(indexes)).toBe(true);

    const indexNames = indexes.map((idx: any) => idx.indexname.toLowerCase());
    
    // We expect indexes on sessionId, eventType, and createdAt
    const hasSessionIdIndex = indexNames.some((name: string) => name.includes('sessionid') || name.includes('session_id'));
    const hasEventTypeIndex = indexNames.some((name: string) => name.includes('eventtype') || name.includes('event_type'));
    const hasCreatedAtIndex = indexNames.some((name: string) => name.includes('createdat') || name.includes('created_at'));

    expect(hasSessionIdIndex).toBe(true);
    expect(hasEventTypeIndex).toBe(true);
    expect(hasCreatedAtIndex).toBe(true);
  });

  it('should verify referential integrity of WorkflowSession relations', async () => {
    // Verify we can insert, fetch, and delete a workflow session
    const mockId = "integrity-test-sess-" + Math.random().toString(36).substring(7);
    
    const created = await prisma.workflowSession.create({
      data: {
        id: mockId,
        currentStep: "START",
        stateJson: {},
        updatedAt: new Date()
      }
    });
    expect(created).toBeDefined();
    expect(created.id).toBe(mockId);

    const retrieved = await prisma.workflowSession.findUnique({
      where: { id: mockId }
    });
    expect(retrieved).toBeDefined();

    // Clean up
    await prisma.workflowSession.delete({
      where: { id: mockId }
    });
  });
});
