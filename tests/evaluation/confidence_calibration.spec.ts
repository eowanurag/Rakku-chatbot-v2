import { SreService } from '../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Confidence Calibration Test
 *
 * Verifies that SreService confidence scores align with actual decision accuracy:
 *   - Tier 0.95+ has accuracy >= 95%
 *   - Tier 0.80+ has accuracy >= 80%
 *   - Tier 0.70+ has accuracy >= 70%
 */
describe('Confidence Calibration Evaluation', () => {
  let sreService: SreService;
  let prisma: PrismaClient;
  const sessionIds: string[] = [];

  beforeAll(() => {
    const emitter = new EventEmitter2();
    sreService = new SreService(emitter);
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    if (sessionIds.length > 0) {
      await prisma.scenarioAssessment.deleteMany({ where: { sessionId: { in: sessionIds } } }).catch(() => {});
      await prisma.scenarioSession.deleteMany({ where: { sessionId: { in: sessionIds } } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('should calibrate confidence scores against actual correctness rates', async () => {
    const testCases = [
      // High Confidence Tier (>= 0.95)
      { hints: ['LOSS', 'DOCUMENT', 'AADHAAR'], expectedScenario: 'AADHAAR', cueConf: 0.99, saeConf: 0.98, tier: 0.95 },
      { hints: ['LOSS', 'MOBILE'], expectedScenario: 'MOBILE', cueConf: 0.99, saeConf: 0.97, tier: 0.95 },
      { hints: ['THEFT', 'VEHICLE'], expectedScenario: 'VEHICLE', cueConf: 0.99, saeConf: 0.98, tier: 0.95 },
      
      // Medium Confidence Tier (0.80 to 0.94)
      { hints: ['LOSS', 'DOCUMENT'], expectedScenario: 'DOCUMENT', cueConf: 0.85, saeConf: 0.80, tier: 0.80 },
      { hints: ['THEFT', 'MOBILE'], expectedScenario: 'MOBILE', cueConf: 0.88, saeConf: 0.82, tier: 0.80 },
      
      // Low Confidence Tier (0.70 to 0.79)
      { hints: ['FRAUD'], expectedScenario: 'FRAUD', cueConf: 0.75, saeConf: 0.70, tier: 0.70 }
    ];

    const results = {
      tier95: { total: 0, correct: 0 },
      tier80: { total: 0, correct: 0 },
      tier70: { total: 0, correct: 0 }
    };

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const sessionId = `calib-test-${i}-${Date.now()}`;
      sessionIds.push(sessionId);

      const result = await sreService.processIntent(
        sessionId,
        tc.hints,
        {},
        { cueConfidence: tc.cueConf, saeConfidence: tc.saeConf, scenarioHints: tc.hints }
      );

      const isCorrect = result.scenario === tc.expectedScenario;

      if (result.scenarioConfidence! >= 0.95) {
        results.tier95.total++;
        if (isCorrect) results.tier95.correct++;
      } else if (result.scenarioConfidence! >= 0.80) {
        results.tier80.total++;
        if (isCorrect) results.tier80.correct++;
      } else if (result.scenarioConfidence! >= 0.70) {
        results.tier70.total++;
        if (isCorrect) results.tier70.correct++;
      }
    }

    const confidence95Accuracy = results.tier95.total > 0 ? (results.tier95.correct / results.tier95.total) * 100 : 100.0;
    const confidence80Accuracy = results.tier80.total > 0 ? (results.tier80.correct / results.tier80.total) * 100 : 100.0;
    const confidence70Accuracy = results.tier70.total > 0 ? (results.tier70.correct / results.tier70.total) * 100 : 100.0;

    const calibrationReport = {
      confidence95Accuracy,
      confidence80Accuracy,
      confidence70Accuracy
    };

    console.log(`[Confidence Calibration Report]`);
    console.log(JSON.stringify(calibrationReport, null, 2));

    // Assert calibration trends hold
    expect(confidence95Accuracy).toBeGreaterThanOrEqual(95);
    expect(confidence80Accuracy).toBeGreaterThanOrEqual(80);
    expect(confidence70Accuracy).toBeGreaterThanOrEqual(70);
  });
});
