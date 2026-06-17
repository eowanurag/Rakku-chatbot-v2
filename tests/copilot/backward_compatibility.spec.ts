import { LegacyIntentAdapter } from '../../backend/src/copilot/sae/adapters/legacy-intent-adapter';
import { SreService } from '../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Rakku V2.7.5 Backward Compatibility Assurance', () => {
  let adapter: LegacyIntentAdapter;
  let sreService: SreService;
  let prisma: PrismaClient;

  beforeAll(() => {
    adapter = new LegacyIntentAdapter();
    const emitter = new EventEmitter2();
    sreService = new SreService(emitter);
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully adapt legacy intent (e.g. LOST_MOBILE) and walk scenario path correctly in SRE', async () => {
    const legacyIntent = "LOST_MOBILE";
    const scenarioHints = adapter.adapt(legacyIntent);
    
    expect(scenarioHints).toEqual(["LOSS", "MOBILE"]);

    const sessionId = "compatibility-test-" + Math.random().toString(36).substring(7);
    const assessment = await sreService.processIntent(sessionId, scenarioHints, {}, {
      cueConfidence: 0.95,
      saeConfidence: 0.95,
      scenarioHints
    });

    expect(assessment).toBeDefined();
    expect(assessment.scenario).toBe("MOBILE");
    expect(assessment.scenarioPath).toContain("LOSS");
    expect(assessment.scenarioPath).toContain("MOBILE");
    expect(assessment.resolutionQuality).toBe("HIGH_CONFIDENCE");
  });

  it('should fallback to GENERAL scenario hint when unknown legacy intent is passed', async () => {
    const legacyIntent = "UNKNOWN_HISTORICAL_INTENT";
    const scenarioHints = adapter.adapt(legacyIntent);
    
    expect(scenarioHints).toEqual(["GENERAL"]);

    const sessionId = "compatibility-test-fallback-" + Math.random().toString(36).substring(7);
    const assessment = await sreService.processIntent(sessionId, scenarioHints, {}, {
      cueConfidence: 0.95,
      saeConfidence: 0.95,
      scenarioHints
    });

    expect(assessment).toBeDefined();
    expect(assessment.scenario).toBe("GENERAL");
    expect(assessment.scenarioPath).toContain("GENERAL");
  });
});
