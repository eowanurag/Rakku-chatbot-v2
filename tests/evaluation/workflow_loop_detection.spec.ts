import { SreService } from '../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Workflow Loop Detection Validation', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const sessionId = `loop-test-${Date.now()}`;

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

  it('should analyze conversation loops and verify LoopRate is 0%', async () => {
    const turn1 = await sreService.processIntent(
      sessionId,
      ['THEFT', 'VEHICLE', 'BIKE'],
      {},
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['THEFT', 'VEHICLE', 'BIKE'] }
    );
    expect(turn1.scenario).toBe('BIKE');

    // Perform loop checks on asked questions
    const session = await prisma.scenarioSession.findUnique({ where: { sessionId } });
    expect(session).toBeDefined();

    const asked = session?.askedQuestions || [];
    // Ensure no duplicates in the asked question sequence
    const uniqueQuestions = new Set(asked);
    const hasLoop = asked.length !== uniqueQuestions.size;
    const loopRate = hasLoop ? 100 : 0;

    expect(loopRate).toBe(0);
  });
});
