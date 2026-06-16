import { SituationAssessmentService } from '../../backend/src/situation-assessment/situation-assessment.service';
import { PrismaService } from '../../backend/src/prisma.service';
import { AiFallbackService } from '../../backend/src/common/ai-fallback/ai-fallback.service';
import { LocalizationService, MetricsService } from '../../backend/src/localization/localization.service';
import axios from 'axios';

jest.mock('axios');

describe('SAE Gemini Outage & Dictionary Classifier Resilience Spec', () => {
  let saeService: SituationAssessmentService;
  let prisma: PrismaService;
  let fallbackService: AiFallbackService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeAll(() => {
    jest.setTimeout(45000);
    prisma = new PrismaService();
    fallbackService = new AiFallbackService();
    saeService = new SituationAssessmentService(prisma, new LocalizationService(new MetricsService()), fallbackService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const testOutageCase = async (text: string, expectedIntent: string, language: 'en' | 'hi' | 'hinglish' = 'en') => {
    // Mock axios.post to fail, simulating a complete Gemini outage
    mockedAxios.post.mockRejectedValue(new Error("429 RESOURCE_EXHAUSTED Quota exceeded for metric: generate_content_requests"));

    const sessionId = "outage-test-" + Math.random().toString(36).substring(7);
    const assessment = await saeService.assess(text, sessionId, language);

    expect(assessment).toBeDefined();
    // Dictionary matched intent
    expect(assessment.intent).toBe(expectedIntent);
    // Confidence matches intent metadata value
    expect(assessment.confidence).toBeGreaterThanOrEqual(0.90);
    
    // Check that Gemini was NOT called (mockedAxios.post was not triggered)
    expect(mockedAxios.post).not.toHaveBeenCalled();

    // Recommendation card is rendered
    expect(assessment.clarificationPrompt).toBeDefined();
    expect(assessment.requiresClarification).toBe(false);
  };

  it('should classify Lost Mobile phrases correctly without calling Gemini', async () => {
    await testOutageCase("मेरा फोन खो गया", "LOST_MOBILE", "hi");
    await testOutageCase("phone kho gaya", "LOST_MOBILE", "hinglish");
    await testOutageCase("lost mobile", "LOST_MOBILE", "en");
  });

  it('should classify Lost Document phrases correctly without calling Gemini', async () => {
    await testOutageCase("मेरा आधार कार्ड खो गया", "LOST_DOCUMENT", "hi");
  });

  it('should classify Cyber Fraud phrases correctly without calling Gemini', async () => {
    await testOutageCase("मेरे खाते से पैसे निकल गए", "CYBER_FRAUD", "hi");
  });

  it('should classify Tenant Verification phrases correctly without calling Gemini', async () => {
    await testOutageCase("मुझे किरायेदार सत्यापन करवाना है", "TENANT_VERIFICATION", "hi");
  });

  it('should classify Character Certificate phrases correctly without calling Gemini', async () => {
    await testOutageCase("मुझे चरित्र प्रमाण पत्र चाहिए", "CHARACTER_CERTIFICATE", "hi");
  });

  it('should handle complete Gemini outages gracefully and mask internal API error details from the citizen', async () => {
    // Send an ambiguous narrative that fails phrase matching, forcing Gemini fallback
    const ambiguousText = "I need some general info about something";
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 429, data: "RESOURCE_EXHAUSTED" },
      message: "API keys quota limit exceeded"
    });

    const sessionId = "outage-test-masking-" + Math.random().toString(36).substring(7);
    const assessment = await saeService.assess(ambiguousText, sessionId, "en");

    expect(assessment).toBeDefined();
    expect(assessment.intent).toBe("UNKNOWN");
    expect(assessment.requiresClarification).toBe(true);

    // Verify the prompt returned to the citizen contains safe fallback messaging
    // and DOES NOT leak any internal details like "Gemini", "Quota", "API keys", "limit"
    const citizenPrompt = assessment.clarificationPrompt;
    expect(citizenPrompt).toContain("I can continue to assist you");
    expect(citizenPrompt).not.toContain("Gemini");
    expect(citizenPrompt).not.toContain("Quota");
    expect(citizenPrompt).not.toContain("API keys");
    expect(citizenPrompt).not.toContain("limit");
  });
});
