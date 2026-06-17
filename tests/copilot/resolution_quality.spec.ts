import { SreService } from '../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('SRE Resolution Quality Mapping', () => {
  let sreService: SreService;
  let prisma: PrismaClient;

  beforeAll(() => {
    const emitter = new EventEmitter2();
    sreService = new SreService(emitter);
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should map high confidence correctly when confidence is >= 0.95', async () => {
    const sessionId = "quality-test-session-1-" + Math.random().toString(36).substring(7);
    const assessment = await sreService.processIntent(sessionId, ["LOSS"], {}, {
      cueConfidence: 0.99,
      saeConfidence: 0.98,
      scenarioHints: ["LOSS"]
    });
    expect(assessment.resolutionQuality).toBe("HIGH_CONFIDENCE");
  });

  it('should map clarification correctly when questions were asked', async () => {
    const sessionId = "quality-test-session-2-" + Math.random().toString(36).substring(7);
    
    // Seed a session with 1 asked question to trigger clarification used logic
    await prisma.scenarioSession.create({
      data: {
        sessionId,
        currentScenario: "DOCUMENT",
        activeScenarioPath: ["LOSS", "DOCUMENT"],
        currentNode: "DOCUMENT",
        askedQuestions: [{ questionId: "documentType", gain: 0.8 }] as any,
        clarificationCount: 1,
        scenarioRevision: 1
      }
    });

    const assessment = await sreService.processIntent(sessionId, ["LOSS", "DOCUMENT"], {}, {
      cueConfidence: 0.80,
      saeConfidence: 0.80,
      scenarioHints: ["LOSS", "DOCUMENT"]
    });
    expect(assessment.resolutionQuality).toBe("CLARIFIED");
  });

  it('should map officer review quality when confidence is low or workflow escalates', async () => {
    const sessionId = "quality-test-session-3-" + Math.random().toString(36).substring(7);
    const assessment = await sreService.processIntent(sessionId, ["LOSS", "DOCUMENT", "PASSPORT"], {}, {
      cueConfidence: 0.10,
      saeConfidence: 0.10,
      scenarioHints: ["LOSS", "DOCUMENT", "PASSPORT"]
    });
    expect(assessment.resolutionQuality).toBe("OFFICER_REVIEW");
  });

  it('should map fallback when unable to resolve with low confidence', async () => {
    const sessionId = "quality-test-session-4-" + Math.random().toString(36).substring(7);
    const assessment = await sreService.processIntent(sessionId, ["LOSS"], {}, {
      cueConfidence: 0.30,
      saeConfidence: 0.30,
      scenarioHints: ["LOSS"]
    });
    expect(assessment.resolutionQuality).toBe("FALLBACK");
  });
});
