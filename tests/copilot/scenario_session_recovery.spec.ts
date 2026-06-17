import { SreService } from '../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('SRE Scenario Session Recovery', () => {
  let sreService: SreService;
  let prisma: PrismaClient;

  beforeAll(() => {
    jest.setTimeout(30000);
    const emitter = new EventEmitter2();
    sreService = new SreService(emitter);
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should recover traversal path when session activeScenarioPath is present', async () => {
    const sessionId = "recovery-test-session-" + Math.random().toString(36).substring(7);

    // Seed session in DB with an active path
    await prisma.scenarioSession.create({
      data: {
        sessionId,
        currentScenario: "DOCUMENT",
        activeScenarioPath: ["LOSS", "DOCUMENT"],
        currentNode: "DOCUMENT",
        scenarioRevision: 1
      }
    });

    // Run SRE process with empty hints to force recovery fallback path
    const assessment = await sreService.processIntent(sessionId, [], {});
    
    expect(assessment).toBeDefined();
    expect(assessment.scenarioPath).toContain("LOSS");
    expect(assessment.scenarioPath).toContain("DOCUMENT");
    expect(assessment.resolutionSource).toBe("GRAPH_ONLY");
  }, 30000);
});
