import { SreService } from '../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Scenario Drift Validation Test
 *
 * Verifies:
 *   1. Initial scenario resolves correctly
 *   2. Changed citizen intent triggers a revision increment (scenarioRevision)
 *   3. Path updates to new target scenario
 *   4. Stale path is discarded
 */
describe('Scenario Drift Validation', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const sessionId = `drift-test-${Date.now()}`;

  beforeAll(() => {
    const emitter = new EventEmitter2();
    sreService = new SreService(emitter);
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.scenarioAssessment.deleteMany({ where: { sessionId } }).catch(() => {});
    await prisma.scenarioSession.deleteMany({ where: { sessionId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('should track scenario drift and discard stale paths correctly across turns', async () => {
    // Turn 1: Lost Aadhaar Card
    const turn1 = await sreService.processIntent(
      sessionId,
      ['LOSS', 'DOCUMENT', 'AADHAAR'],
      {},
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['LOSS', 'DOCUMENT', 'AADHAAR'] }
    );

    expect(turn1.scenario).toBe('AADHAAR');
    expect(turn1.scenarioPath).toContain('AADHAAR');
    
    // Check initial session
    const session1 = await prisma.scenarioSession.findUnique({ where: { sessionId } });
    expect(session1).toBeDefined();
    expect(session1!.scenarioRevision).toBe(1);

    // Turn 2: Drift to Theft of Mobile Phone
    const turn2 = await sreService.processIntent(
      sessionId,
      ['THEFT', 'MOBILE'],
      {},
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['THEFT', 'MOBILE'] }
    );

    expect(turn2.scenario).toBe('MOBILE');
    expect(turn2.scenarioPath).toContain('MOBILE');
    // Stale Aadhaar path must be discarded (should not contain AADHAAR anymore)
    expect(turn2.scenarioPath).not.toContain('AADHAAR');

    // Check session revision increments
    const session2 = await prisma.scenarioSession.findUnique({ where: { sessionId } });
    expect(session2).toBeDefined();
    expect(session2!.scenarioRevision).toBeGreaterThan(1); // Incremented due to drift

    console.log(`[Scenario Drift Validation]`);
    console.log(`  Turn 1 Scenario: ${turn1.scenario} | Revision: 1`);
    console.log(`  Turn 2 Scenario: ${turn2.scenario} | Revision: ${session2!.scenarioRevision}`);
  });
});
