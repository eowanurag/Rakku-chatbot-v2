import { SreService } from '../../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

jest.setTimeout(60000);

describe('Aadhaar Loss Incident Regression Suite', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const sessionId = `aadhaar-loss-regression-${Date.now()}`;

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

  it('should process aadhaar loss without scenario drift', async () => {
    const turn1 = await sreService.processIntent(
      sessionId,
      ['LOSS', 'DOCUMENT', 'AADHAAR'],
      { name: 'Mohan Singh', mobile: '9988776655', district: 'Lucknow', misuseSuspected: true },
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['LOSS', 'DOCUMENT', 'AADHAAR'] }
    );

    expect(turn1.scenario).toBe('AADHAAR');
    expect(turn1.scenarioPath).toContain('LOSS');
    expect(turn1.scenarioPath).toContain('AADHAAR');
    expect(turn1.outcome).toBe('DOCUMENT_REPLACEMENT');
  });
});
