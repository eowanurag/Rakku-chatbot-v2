import { SreService } from '../../backend/src/copilot/sre/sre.service';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('SRE Scenario Graph Candidate Governance', () => {
  let sreService: SreService;
  let prisma: PrismaClient;

  beforeAll(() => {
    const emitter = new EventEmitter2();
    sreService = new SreService(emitter);
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.scenarioGraphCandidate.deleteMany();
    await prisma.$disconnect();
  });

  it('should record scenario graph miss candidates correctly without auto-approving', async () => {
    const sessionId = "candidate-test-session-" + Math.random().toString(36).substring(7);
    
    // We pass hints containing a non-registered child node (e.g. "AADHAAR_CARD") under a registered parent node in path (e.g. "DOCUMENT")
    // Let's pass seeds ["LOSS", "DOCUMENT", "AADHAAR_CARD"]
    // DOCUMENT is a known parent node, but AADHAAR_CARD is not registered under SRE graph nodes (graphs.json has AADHAAR, not AADHAAR_CARD)
    await sreService.processIntent(sessionId, ["LOSS", "DOCUMENT", "AADHAAR_CARD"], {}, {
      cueConfidence: 0.95,
      saeConfidence: 0.95,
      scenarioHints: ["LOSS", "DOCUMENT", "AADHAAR_CARD"]
    });

    // Check if ScenarioGraphCandidate is created
    const candidates = await prisma.scenarioGraphCandidate.findMany({
      where: {
        parentNode: "DOCUMENT",
        proposedNode: "AADHAAR_CARD"
      }
    });

    expect(candidates.length).toBe(1);
    expect(candidates[0].occurrences).toBe(1);
    expect(candidates[0].status).toBe("PENDING"); // Never auto-approved
  });

  it('should increment occurrences for existing candidates on subsequent graph misses', async () => {
    const sessionId = "candidate-test-session-2-" + Math.random().toString(36).substring(7);
    
    await sreService.processIntent(sessionId, ["LOSS", "DOCUMENT", "AADHAAR_CARD"], {}, {
      cueConfidence: 0.95,
      saeConfidence: 0.95,
      scenarioHints: ["LOSS", "DOCUMENT", "AADHAAR_CARD"]
    });

    const candidates = await prisma.scenarioGraphCandidate.findMany({
      where: {
        parentNode: "DOCUMENT",
        proposedNode: "AADHAAR_CARD"
      }
    });

    expect(candidates.length).toBe(1);
    expect(candidates[0].occurrences).toBe(2);
  });
});
