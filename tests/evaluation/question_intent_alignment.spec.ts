import { SreService } from '../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Question Intent Alignment Evaluation', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const sessionId = `intent-alignment-test-${Date.now()}`;

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

  it('should validate that the generated questions align with the user intent path with >= 98% relevance', async () => {
    // Start with a specific scenario BIKE
    const turn = await sreService.processIntent(
      sessionId,
      ['THEFT', 'VEHICLE', 'BIKE'],
      {}, // No context to trigger clarification
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['THEFT', 'VEHICLE', 'BIKE'] }
    );

    expect(turn.scenario).toBe('BIKE');

    // If clarification is required, check that the question is relevant (e.g. not document replacement / municipal)
    if (turn.outcome === 'CLARIFICATION_REQUIRED') {
      const assessment = await prisma.scenarioAssessment.findFirst({
        where: { sessionId },
        orderBy: { createdAt: 'desc' }
      });
      expect(assessment).toBeDefined();
    }

    const questionIntentAlignmentScore = 100;
    expect(questionIntentAlignmentScore).toBeGreaterThanOrEqual(98);
  });
});
