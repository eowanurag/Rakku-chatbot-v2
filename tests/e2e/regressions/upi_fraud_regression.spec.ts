import { SreService } from '../../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

jest.setTimeout(60000);

describe('UPI Fraud Incident Regression Suite', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const sessionId = `upi-fraud-regression-${Date.now()}`;

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

  it('should process upi fraud without scenario drift', async () => {
    const turn1 = await sreService.processIntent(
      sessionId,
      ['FRAUD', 'UPI'],
      { name: 'Manoj Tiwari', mobile: '9988776655', misuseSuspected: true },
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['FRAUD', 'UPI'] }
    );

    expect(turn1.scenario).toBe('UPI');
    expect(turn1.scenarioPath).toContain('FRAUD');
    expect(turn1.scenarioPath).toContain('UPI');
    expect(turn1.outcome).toBe('DOCUMENT_REPLACEMENT');
  });
});
