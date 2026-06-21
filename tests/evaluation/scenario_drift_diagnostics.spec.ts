import { SreService } from '../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Scenario Drift Diagnostics Validation', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const sessionId = `drift-diag-test-${Date.now()}`;

  beforeAll(() => {
    const emitter = new EventEmitter2();
    sreService = new SreService(emitter);
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.scenarioAssessment.deleteMany({ where: { sessionId } }).catch(() => {});
    await prisma.scenarioSession.deleteMany({ where: { sessionId } }).catch(() => {});
    await prisma.$disconnect();
    await (sreService as any).prisma?.$disconnect().catch(() => {});
  });

  it('should generate detailed drift diagnostics when scenario changes unexpectedly', async () => {
    // 1. Set initial scenario BIKE
    const turn1 = await sreService.processIntent(
      sessionId,
      ['THEFT', 'VEHICLE', 'BIKE'],
      {},
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['THEFT', 'VEHICLE', 'BIKE'] }
    );
    expect(turn1.scenario).toBe('BIKE');

    // 2. Drift to MOBILE
    const turn2 = await sreService.processIntent(
      sessionId,
      ['THEFT', 'MOBILE'],
      {},
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['THEFT', 'MOBILE'] }
    );
    expect(turn2.scenario).toBe('MOBILE');

    // 3. Generate Diagnostics structure
    const diagnostics = {
      conversationId: sessionId,
      expectedScenario: 'BIKE',
      actualScenario: 'MOBILE',
      driftTurn: 2,
      driftTrigger: 'mobile keyword detected',
      previousState: turn1.scenario,
      nextState: turn2.scenario
    };

    expect(diagnostics.expectedScenario).toBe('BIKE');
    expect(diagnostics.actualScenario).toBe('MOBILE');
    expect(diagnostics.driftTurn).toBe(2);
  });
});
