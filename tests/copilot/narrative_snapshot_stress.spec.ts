import { ComplaintIntelligenceService } from '../../backend/src/complaint-intelligence/complaint-intelligence.service';
import { PrismaService } from '../../backend/src/prisma.service';

describe('CIE Narrative Snapshot Stress Validation Spec', () => {
  let cieService: ComplaintIntelligenceService;
  let prisma: PrismaService;

  beforeAll(() => {
    jest.setTimeout(120000); // Give plenty of time for 20 iterations
    prisma = new PrismaService();
    cieService = new ComplaintIntelligenceService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should preserve and track narrative snapshots across 20 successive edits without degradation', async () => {
    const sessionId = "stress-test-session-" + Math.random().toString(36).substring(7);
    let currentNarrative = "Initial text of the complaint about a lost mobile.";
    let changeSummary = "Initial entry";
    
    // We run 20 updates in series
    for (let i = 1; i <= 20; i++) {
      if (i > 1) {
        currentNarrative += ` Added detail number ${i}.`;
        changeSummary = `Clarification edit ${i}`;
      }

      const result = await cieService.assess(currentNarrative, sessionId, "LOST_MOBILE", "en", changeSummary);
      
      expect(result).toBeDefined();
      expect(result.narrativeSnapshots).toBeDefined();
      expect(result.narrativeSnapshots?.length).toBe(i);
      
      const latestSnapshot = result.narrativeSnapshots?.[i - 1];
      expect(latestSnapshot?.version).toBe(i);
      expect(latestSnapshot?.changeSummary).toBe(changeSummary);
      expect(latestSnapshot?.narrative).toBe(currentNarrative);

      // Verify DB versioning chain
      const dbRecord = await prisma.complaintAssessment.findFirst({
        where: { sessionId, factVersion: i }
      });
      expect(dbRecord).toBeDefined();
      expect(dbRecord?.factVersion).toBe(i);
      if (i > 1) {
        expect(dbRecord?.parentAssessmentId).not.toBeNull();
      }
    }
  }, 120000);
});
