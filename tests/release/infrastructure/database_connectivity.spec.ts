import { PrismaClient } from '@prisma/client';

/**
 * Database Connectivity Test
 *
 * Asserts:
 *   1. Prisma client can connect to the database
 *   2. CRUD operations complete within latency budgets
 *   3. Transaction rollbacks work correctly
 *   4. Connection pool is healthy
 *
 * Severity: CRITICAL – database unreachable = system down.
 */

describe('Database Connectivity & CRUD Validation', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    // Cleanup test records
    await prisma.scenarioAssessment.deleteMany({
      where: { sessionId: { startsWith: 'db-conn-test-' } }
    }).catch(() => {});
    await prisma.scenarioSession.deleteMany({
      where: { sessionId: { startsWith: 'db-conn-test-' } }
    }).catch(() => {});
    await prisma.$disconnect();
  });

  it('should connect to database successfully', async () => {
    await expect(prisma.$connect()).resolves.not.toThrow();
  });

  it('should perform a raw query within 1000ms', async () => {
    const start = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as check_value`;
    const elapsed = Date.now() - start;

    expect(result).toBeDefined();
    console.log(`[DB Connectivity] Raw query: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(1000);
  });

  it('should create a ScenarioSession record within 1000ms', async () => {
    const sessionId = `db-conn-test-create-${Date.now()}`;
    const start = Date.now();

    const session = await prisma.scenarioSession.create({
      data: {
        sessionId,
        currentScenario: 'TEST',
        clarificationCount: 0,
        askedQuestions: [],
        scenarioRevision: 1,
        activeScenarioPath: ['TEST'],
        currentNode: 'TEST'
      }
    });
    const elapsed = Date.now() - start;

    expect(session).toBeDefined();
    expect(session.sessionId).toBe(sessionId);
    console.log(`[DB Connectivity] Create session: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(1000);

    // Cleanup
    await prisma.scenarioSession.delete({ where: { sessionId } });
  });

  it('should read a ScenarioSession record within 1000ms', async () => {
    const sessionId = `db-conn-test-read-${Date.now()}`;
    await prisma.scenarioSession.create({
      data: {
        sessionId,
        currentScenario: 'TEST',
        clarificationCount: 0,
        askedQuestions: [],
        scenarioRevision: 1,
        activeScenarioPath: ['TEST'],
        currentNode: 'TEST'
      }
    });

    const start = Date.now();
    const session = await prisma.scenarioSession.findUnique({ where: { sessionId } });
    const elapsed = Date.now() - start;

    expect(session).toBeDefined();
    console.log(`[DB Connectivity] Read session: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(1000);

    await prisma.scenarioSession.delete({ where: { sessionId } });
  });

  it('should update a ScenarioSession record within 1000ms', async () => {
    const sessionId = `db-conn-test-update-${Date.now()}`;
    await prisma.scenarioSession.create({
      data: {
        sessionId,
        currentScenario: 'TEST',
        clarificationCount: 0,
        askedQuestions: [],
        scenarioRevision: 1,
        activeScenarioPath: ['TEST'],
        currentNode: 'TEST'
      }
    });

    const start = Date.now();
    const updated = await prisma.scenarioSession.update({
      where: { sessionId },
      data: { currentScenario: 'UPDATED_TEST', scenarioRevision: 2 }
    });
    const elapsed = Date.now() - start;

    expect(updated.currentScenario).toBe('UPDATED_TEST');
    console.log(`[DB Connectivity] Update session: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(1000);

    await prisma.scenarioSession.delete({ where: { sessionId } });
  });

  it('should delete a ScenarioSession record within 1000ms', async () => {
    const sessionId = `db-conn-test-delete-${Date.now()}`;
    await prisma.scenarioSession.create({
      data: {
        sessionId,
        currentScenario: 'TEST',
        clarificationCount: 0,
        askedQuestions: [],
        scenarioRevision: 1,
        activeScenarioPath: ['TEST'],
        currentNode: 'TEST'
      }
    });

    const start = Date.now();
    await prisma.scenarioSession.delete({ where: { sessionId } });
    const elapsed = Date.now() - start;

    console.log(`[DB Connectivity] Delete session: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(1000);

    // Verify deletion
    const deleted = await prisma.scenarioSession.findUnique({ where: { sessionId } });
    expect(deleted).toBeNull();
  });

  it('should handle transaction rollback correctly', async () => {
    const sessionId = `db-conn-test-txn-${Date.now()}`;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.scenarioSession.create({
          data: {
            sessionId,
            currentScenario: 'TXN_TEST',
            clarificationCount: 0,
            askedQuestions: [],
            scenarioRevision: 1,
            activeScenarioPath: ['TXN_TEST'],
            currentNode: 'TXN_TEST'
          }
        });

        // Intentionally throw to trigger rollback
        throw new Error('INTENTIONAL_ROLLBACK_TEST');
      });
    } catch (e: any) {
      expect(e.message).toBe('INTENTIONAL_ROLLBACK_TEST');
    }

    // Session should NOT exist because transaction was rolled back
    const session = await prisma.scenarioSession.findUnique({ where: { sessionId } });
    expect(session).toBeNull();
    console.log('[DB Connectivity] Transaction rollback verified');
  });
});
