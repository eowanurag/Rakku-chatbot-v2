import { SituationAssessmentService } from '../../backend/src/situation-assessment/situation-assessment.service';
import { PrismaService } from '../../backend/src/prisma.service';

describe('Situation Assessment Engine (SAE) Validation', () => {
  let saeService: SituationAssessmentService;
  let prisma: PrismaService;

  beforeAll(() => {
    jest.setTimeout(30000);
    prisma = new PrismaService();
    saeService = new SituationAssessmentService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully classify a lost mobile statement using local rule/pattern matched triggers', async () => {
    const sessionId = "sae-test-session-" + Math.random().toString(36).substring(7);
    const text = "I lost my iPhone 14 yesterday at Gomti Nagar Lucknow. Please help me file a report.";
    
    const assessment = await saeService.assess(text, sessionId);

    expect(assessment).toBeDefined();
    expect(assessment.intent).toBe("LOST_PROPERTY");
    expect(assessment.incidentCategory).toBe("LOST_PROPERTY");
    expect(assessment.urgency).toBe("MEDIUM");
    expect(assessment.confidence).toBeGreaterThanOrEqual(0.8);
    expect(assessment.requiresClarification).toBe(false);
    expect(assessment.recommendedServices).toContain("COMPLAINT");
    expect(assessment.recommendedServices).toContain("TRACKING_GUIDANCE");
    
    // Check recommendation card formatting
    const card = assessment.clarificationPrompt;
    expect(card).toContain("I understand.");
    expect(card).toContain("lost property");
    expect(card).toContain("Urgency:");
    expect(card).toContain("Recommended Services:");
    expect(card).toContain("Complaint Registration");
  }, 30000);

  it('should trigger clarification on unknown/ambiguous statements', async () => {
    const sessionId = "sae-test-session-" + Math.random().toString(36).substring(7);
    const text = "Hmm, I am not really sure what to do here.";
    
    const assessment = await saeService.assess(text, sessionId);

    expect(assessment).toBeDefined();
    expect(assessment.requiresClarification).toBe(true);
    expect(assessment.clarificationType).toBe("SERVICE_SELECTION");
    expect(assessment.clarificationPrompt).toContain("I'd like to understand your situation better");
  }, 30000);

  it('should track versioning chain correctly across successive narratives', async () => {
    const sessionId = "sae-test-session-version-" + Math.random().toString(36).substring(7);
    
    // Version 1
    const text1 = "My phone was lost.";
    const assessment1 = await saeService.assess(text1, sessionId);
    expect((assessment1 as any).id).toBeDefined();
    
    // Find record in DB
    const dbAssessment1 = await prisma.intentClassification.findUnique({
      where: { id: (assessment1 as any).id }
    });
    expect(dbAssessment1?.assessmentVersion).toBe(1);
    expect(dbAssessment1?.parentAssessmentId).toBeNull();

    // Version 2
    const text2 = "Actually, someone stole my vehicle.";
    const assessment2 = await saeService.assess(text2, sessionId);
    expect((assessment2 as any).id).toBeDefined();

    const dbAssessment2 = await prisma.intentClassification.findUnique({
      where: { id: (assessment2 as any).id }
    });
    expect(dbAssessment2?.assessmentVersion).toBe(2);
    expect(dbAssessment2?.parentAssessmentId).toBe(assessment1.id);
  }, 30000);
});
