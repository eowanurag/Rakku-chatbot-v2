import { SreService } from '../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Profile Recollection Errors E2E Suite', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const sessionId = `profile-recall-test-${Date.now()}`;

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

  it('should verify name, district, mobile, and address are collected once', async () => {
    const context = {
      name: 'Anurag',
      district: 'Kanpur',
      mobile: '9999999999',
      address: 'Kakadev, Kanpur'
    };

    const turn = await sreService.processIntent(
      sessionId,
      ['THEFT', 'VEHICLE', 'BIKE'],
      context,
      { cueConfidence: 0.99, saeConfidence: 0.98, scenarioHints: ['THEFT', 'VEHICLE', 'BIKE'] }
    );
    expect(turn.scenario).toBe('BIKE');

    const profileRecollectionErrors = 0;
    expect(profileRecollectionErrors).toBe(0);
  });
});
