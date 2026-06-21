import { SreService } from '../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Workflow Outcome Certification E2E Validation', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const sessionIds: string[] = [];

  beforeAll(() => {
    const emitter = new EventEmitter2();
    sreService = new SreService(emitter);
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    for (const sessionId of sessionIds) {
      await prisma.scenarioAssessment.deleteMany({ where: { sessionId } }).catch(() => {});
      await prisma.scenarioSession.deleteMany({ where: { sessionId } }).catch(() => {});
    }
    await prisma.$disconnect();
    await (sreService as any).prisma?.$disconnect().catch(() => {});
  });

  it('should verify that BIKE theft reaches the correct outcome', async () => {
    const sessionId = `outcome-cert-bike-${Date.now()}`;
    sessionIds.push(sessionId);

    const turn = await sreService.processIntent(
      sessionId,
      ['THEFT', 'VEHICLE', 'BIKE'],
      { incidentDate: '2026-06-19', incidentLocation: 'Kanpur', mobile: '7766776677', name: 'Mohan' },
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['THEFT', 'VEHICLE', 'BIKE'] }
    );

    expect(turn.scenario).toBe('BIKE');
    expect(turn.outcome).toBe('DOCUMENT_REPLACEMENT');
  });

  it('should verify that UPI cyber fraud reaches the correct outcome', async () => {
    const sessionId = `outcome-cert-upi-${Date.now()}`;
    sessionIds.push(sessionId);

    const turn = await sreService.processIntent(
      sessionId,
      ['FRAUD', 'CYBER_CRIME', 'UPI'],
      { incidentDate: '2026-06-19', incidentLocation: 'Lucknow', mobile: '8877887788', name: 'Rohan', misuseSuspected: true },
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['FRAUD', 'CYBER_CRIME', 'UPI'] }
    );

    expect(turn.scenario).toBe('UPI');
    expect(turn.outcome).toBe('DOCUMENT_REPLACEMENT');
  });
});
