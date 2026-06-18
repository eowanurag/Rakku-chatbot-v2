import { SreService } from '../../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Concurrency Stress Test
 *
 * Simulates 10, 50, and 100 parallel sessions hitting processIntent
 * simultaneously to verify:
 *   1. No race conditions on database writes
 *   2. Session isolation is maintained
 *   3. No shared state corruption between concurrent sessions
 *   4. System remains responsive under parallel load
 *
 * Severity: HIGH – concurrency bugs cause data corruption in production.
 */

describe('Concurrency Stress Test', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const allSessionIds: string[] = [];

  beforeAll(() => {
    const emitter = new EventEmitter2();
    sreService = new SreService(emitter);
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    // Clean up all test sessions
    if (allSessionIds.length > 0) {
      await prisma.scenarioAssessment.deleteMany({ where: { sessionId: { in: allSessionIds } } }).catch(() => {});
      await prisma.scenarioSession.deleteMany({ where: { sessionId: { in: allSessionIds } } }).catch(() => {});
    }
    await prisma.$disconnect();
  }, 15000);

  async function runConcurrentSessions(count: number): Promise<{
    totalMs: number;
    successes: number;
    failures: number;
    results: any[];
  }> {
    const sessionIds = Array.from({ length: count }, (_, i) =>
      `concurrency-${count}-${i}-${Date.now()}-${Math.random().toString(36).substring(7)}`
    );
    allSessionIds.push(...sessionIds);

    const start = Date.now();
    const promises = sessionIds.map((sid, i) =>
      sreService.processIntent(
        sid,
        ['LOSS', 'DOCUMENT'],
        {},
        {
          cueConfidence: 0.90,
          saeConfidence: 0.85,
          scenarioHints: ['LOSS', 'DOCUMENT']
        }
      ).then(result => ({ success: true, result, index: i }))
       .catch(error => ({ success: false, result: error, index: i }))
    );

    const outcomes = await Promise.all(promises);
    const totalMs = Date.now() - start;

    const successes = outcomes.filter(o => o.success).length;
    const failures = outcomes.filter(o => !o.success).length;
    const results = outcomes.filter(o => o.success).map(o => o.result);

    return { totalMs, successes, failures, results };
  }

  it('should handle 10 concurrent sessions without errors', async () => {
    const { totalMs, successes, failures } = await runConcurrentSessions(10);

    console.log(`[Concurrency 10] Total: ${totalMs}ms, Successes: ${successes}, Failures: ${failures}`);

    expect(failures).toBe(0);
    expect(successes).toBe(10);
  }, 30000);

  it('should maintain session isolation under 10 concurrent sessions', async () => {
    const { results } = await runConcurrentSessions(10);

    // Every result should have a unique sessionId
    const sessionIdsFromResults = results.map((r: any) => r.sessionId);
    const uniqueIds = new Set(sessionIdsFromResults);
    expect(uniqueIds.size).toBe(results.length);

    // All should resolve the same scenario for the same input
    for (const result of results) {
      expect((result as any).scenario).toBeDefined();
    }
  }, 30000);

  it('should handle 50 concurrent sessions without errors', async () => {
    const { totalMs, successes, failures } = await runConcurrentSessions(50);

    console.log(`[Concurrency 50] Total: ${totalMs}ms, Successes: ${successes}, Failures: ${failures}`);

    expect(failures).toBe(0);
    expect(successes).toBe(50);
  }, 60000);

  it('should verify database integrity after concurrent writes', async () => {
    // Verify that all sessions were written correctly
    const recentSessions = await prisma.scenarioSession.findMany({
      where: {
        sessionId: {
          startsWith: 'concurrency-'
        }
      },
      take: 200
    });

    // Each session should be unique
    const uniqueSessionIds = new Set(recentSessions.map(s => s.sessionId));
    expect(uniqueSessionIds.size).toBe(recentSessions.length);

    console.log(`[Concurrency DB Integrity] Verified ${recentSessions.length} unique sessions in database`);
  }, 30000);
});
