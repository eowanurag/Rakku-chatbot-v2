import { SreService } from '../../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

jest.setTimeout(60000);

describe('Tenant Verification Incident Regression Suite', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const sessionId = `tenant-verification-regression-${Date.now()}`;

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

  it('should process tenant verification without scenario drift', async () => {
    const turn1 = await sreService.processIntent(
      sessionId,
      ['SERVICES', 'TENANT_VERIFICATION'],
      { name: 'Manoj Tiwari', mobile: '9988776655', misuseSuspected: true },
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['SERVICES', 'TENANT_VERIFICATION'] }
    );

    expect(turn1.scenario).toBe('TENANT_VERIFICATION');
    expect(turn1.scenarioPath).toContain('SERVICES');
    expect(turn1.scenarioPath).toContain('TENANT_VERIFICATION');
    expect(turn1.outcome).toBe('DOCUMENT_REPLACEMENT');
  });
});
