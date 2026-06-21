import { SreService } from '../../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

jest.setTimeout(60000);

describe('Missing Person Incident Regression Suite', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const sessionId = `missing-person-regression-${Date.now()}`;

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

  it('should process missing person without scenario drift', async () => {
    const turn1 = await sreService.processIntent(
      sessionId,
      ['SAFETY', 'MISSING_PERSON'],
      { name: 'Mohan Singh', mobile: '9900990099', district: 'Lucknow', misuseSuspected: true },
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['SAFETY', 'MISSING_PERSON'] }
    );

    expect(turn1.scenario).toBe('MISSING_PERSON');
    expect(turn1.scenarioPath).toContain('SAFETY');
    expect(turn1.scenarioPath).toContain('MISSING_PERSON');
    expect(turn1.outcome).toBe('DOCUMENT_REPLACEMENT');
  });
});
