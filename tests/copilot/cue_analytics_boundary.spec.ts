import { PrismaService } from '../../backend/src/prisma.service';
import { CueReplayService } from '../../backend/src/copilot/cue/analytics/cue-replay.service';
import { DictionaryUnderstandingProvider } from '../../backend/src/copilot/cue/runtime/providers/dictionary-understanding.provider';

describe('CUE Analytics & Replay Boundary Verification', () => {
  let prisma: PrismaService;
  let replayService: CueReplayService;

  beforeAll(() => {
    jest.setTimeout(30000);
    prisma = new PrismaService();
    const provider = new DictionaryUnderstandingProvider();
    replayService = new CueReplayService(prisma, provider);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should run historical replay as audit-only without modifying production logs', async () => {
    // Record baseline count
    const initialAssessments = await prisma.intentClassification.count();

    const sampleNarratives = [
      "hamar upi payment failed",
      "more mobile kho gaya"
    ];

    const replayRes = await replayService.runReplay("1.0.0", "1.1.0", sampleNarratives);
    expect(replayRes.replayId).toBeDefined();
    expect(replayRes.improvementScore).toBeGreaterThanOrEqual(0.0);

    // Verify intent classification logs size remains exactly identical
    const postReplayAssessments = await prisma.intentClassification.count();
    expect(postReplayAssessments).toBe(initialAssessments);
  });
});
