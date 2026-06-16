import { ComplaintIntelligenceService } from '../../backend/src/complaint-intelligence/complaint-intelligence.service';
import { PrismaService } from '../../backend/src/prisma.service';

describe('Complaint Intelligence Engine (CIE) Validation', () => {
  let cieService: ComplaintIntelligenceService;
  let prisma: PrismaService;

  beforeAll(() => {
    jest.setTimeout(30000);
    prisma = new PrismaService();
    cieService = new ComplaintIntelligenceService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should extract facts and analyze gaps for LOST_MOBILE correctly', async () => {
    const sessionId = "cie-test-session-" + Math.random().toString(36).substring(7);
    const narrative = "I lost my Samsung phone yesterday. It was black and bought last year.";

    const result = await cieService.assess(narrative, sessionId, "LOST_MOBILE", "en", "Initial narrative");

    expect(result).toBeDefined();
    expect(result.incidentType).toBe("LOST_MOBILE");
    
    // Check fact extraction
    const brandFact = result.extractedFacts.find(f => f.field === 'property_brand');
    expect(brandFact).toBeDefined();
    expect(brandFact?.value).toBe('Samsung');
    expect(brandFact?.confidence).toBeGreaterThan(0.9);

    // Check gap analysis
    expect(result.complaintReadinessScore).toBeLessThan(1.0); // missing incident_location, property_model, imei, etc.
    const missingLocation = result.missingInformation.find(m => m.field === 'incident_location');
    expect(missingLocation).toBeDefined();
    expect(missingLocation?.priority).toBe('HIGH');

    // Check status in DB Session
    const session = await prisma.complaintSession.findUnique({
      where: { sessionId }
    });
    expect(session).toBeDefined();
    expect(session?.status).toBe("CLARIFYING");
    expect(session?.clarificationRequired).toBe(true);
  }, 30000);

  it('should detect location contradictions correctly', async () => {
    const sessionId = "cie-test-session-" + Math.random().toString(36).substring(7);
    const narrative = "My phone was stolen in Lucknow. No wait, actually it happened in Kanpur.";

    const result = await cieService.assess(narrative, sessionId, "LOST_MOBILE");

    expect(result.contradictions).toBeDefined();
    const locContradiction = result.contradictions.find(c => c.type === 'LOCATION_CONTRADICTION');
    expect(locContradiction).toBeDefined();
    expect(locContradiction?.details).toContain("Lucknow and Kanpur");
  }, 30000);

  it('should track versioning chain and narrative snapshots with change summaries', async () => {
    const sessionId = "cie-test-session-snapshots-" + Math.random().toString(36).substring(7);

    // Narrative version 1
    const narrative1 = "My phone is lost.";
    const result1 = await cieService.assess(narrative1, sessionId, "LOST_MOBILE", "en", "Initial entry");
    expect(result1.narrativeSnapshots).toBeDefined();
    expect(result1.narrativeSnapshots.length).toBe(1);
    expect(result1.narrativeSnapshots[0].version).toBe(1);
    expect(result1.narrativeSnapshots[0].changeSummary).toBe("Initial entry");

    // Narrative version 2
    const narrative2 = "My Samsung phone was lost.";
    const result2 = await cieService.assess(narrative2, sessionId, "LOST_MOBILE", "en", "Added brand details");
    expect(result2.narrativeSnapshots.length).toBe(2);
    expect(result2.narrativeSnapshots[1].version).toBe(2);
    expect(result2.narrativeSnapshots[1].changeSummary).toBe("Added brand details");
    expect(result2.narrativeSnapshots[1].narrative).toBe(narrative2);

    // Verify DB records
    const assessment2 = await prisma.complaintAssessment.findFirst({
      where: { sessionId, factVersion: 2 }
    });
    expect(assessment2).toBeDefined();
    expect(assessment2?.parentAssessmentId).toBeDefined();
    expect(assessment2?.parentAssessmentId).not.toBeNull();
  }, 30000);
});
