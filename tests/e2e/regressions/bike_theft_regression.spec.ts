import { SreService } from '../../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

jest.setTimeout(60000);

describe('Bike Theft Incident Regression Suite - Sentinel Release Blocker', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const sessionId = `bike-theft-sentinel-${Date.now()}`;

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

  it('should verify Scenario Stability, Question Relevance, and State Preservation end-to-end', async () => {
    // 1. Send bike theft incident with required information to bypass clarification
    const turn1 = await sreService.processIntent(
      sessionId,
      ['THEFT', 'VEHICLE', 'BIKE'],
      { district: 'Kanpur', area: 'Kakadev', name: 'Mohan Tiwari', mobile: '7766776677', address: 'काकादेव कानपुर', incidentDate: '2026-06-19', incidentLocation: 'Kanpur' },
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['THEFT', 'VEHICLE', 'BIKE'] }
    );

    // Assert Scenario remains BIKE
    expect(turn1.scenario).toBe('BIKE');
    expect(turn1.scenarioPath).toContain('THEFT');
    expect(turn1.scenarioPath).toContain('VEHICLE');
    expect(turn1.scenarioPath).toContain('BIKE');

    // Scenario Stability: Verify scenario lock does not drift
    const forbiddenDrifts = ['LOST_MOBILE', 'DOCUMENT_LOSS', 'GENERAL_QUERY', 'MAIN_MENU', 'MOBILE'];
    for (const drift of forbiddenDrifts) {
      expect(turn1.scenarioPath).not.toContain(drift);
    }

    // Question Relevance: Questions/actions must be theft-related
    const recommendedActions = turn1.actionPlan.recommendedActions || [];
    const recommendedActionsStr = JSON.stringify(recommendedActions).toLowerCase();
    
    expect(recommendedActionsStr).not.toContain('imei');
    expect(recommendedActionsStr).not.toContain('sim card');
    expect(recommendedActionsStr).not.toContain('tenant');
    expect(recommendedActionsStr).not.toContain('certificate');

    // State Preservation
    const session = await prisma.scenarioSession.findUnique({ where: { sessionId } });
    expect(session).toBeDefined();

    // Verify outcome is Document Replacement (mapped outcome for BIKE scenario in outcome rules)
    expect(turn1.outcome).toBe('DOCUMENT_REPLACEMENT');
  });
});
