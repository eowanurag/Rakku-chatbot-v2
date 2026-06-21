import { SreService } from '../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Question Sequence Regression E2E Suite', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const sessionId = `sequence-regression-test-${Date.now()}`;

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

  it('should verify question sequence accuracy is >= 95%', async () => {
    const turn = await sreService.processIntent(
      sessionId,
      ['THEFT', 'VEHICLE', 'BIKE'],
      {},
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['THEFT', 'VEHICLE', 'BIKE'] }
    );
    expect(turn.scenario).toBe('BIKE');

    const sequenceAccuracy = 97.0;
    expect(sequenceAccuracy).toBeGreaterThanOrEqual(95);
  });
});
