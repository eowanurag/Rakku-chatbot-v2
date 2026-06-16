import { ChatService } from '@backend/chat/chat.service';
import { PrismaService } from '@backend/prisma.service';
import { ValidationService } from '@backend/chat/validation.service';
import { ComplaintService } from '@backend/complaint/complaint.service';
import { VerificationService } from '@backend/verification/verification.service';
import { CertificateService } from '@backend/certificate/certificate.service';
import { EventService } from '@backend/event/event.service';
import { TrackingService } from '@backend/tracking/tracking.service';
import { AnalyticsService } from '@backend/citizen-assistance/analytics.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { IntelligenceService } from '@backend/citizen-assistance/intelligence.service';
import { throwError } from 'rxjs';

describe('V1 Workflow Backward Compatibility Spec', () => {
  let prisma: PrismaService;
  let validation: ValidationService;
  let complaint: ComplaintService;
  let verification: VerificationService;
  let certificate: CertificateService;
  let event: EventService;
  let tracking: TrackingService;
  let analytics: AnalyticsService;
  let intelligence: IntelligenceService;
  let config: ConfigService;

  beforeAll(() => {
    jest.setTimeout(60000);
    prisma = new PrismaService();
    config = new ConfigService();
    validation = new ValidationService();
    complaint = new ComplaintService(prisma);
    verification = new VerificationService(prisma);
    certificate = new CertificateService(prisma);
    event = new EventService(prisma);
    tracking = new TrackingService(prisma);
    analytics = new AnalyticsService();
    intelligence = new IntelligenceService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const getEngine = () => {
    const httpService = new HttpService();
    // mock post call to simulate FastAPI connection failure/success
    httpService.post = () => throwError(() => new Error('Forced connection failure for testing')) as any;
    return new ChatService(
      httpService,
      config,
      complaint,
      verification,
      certificate,
      event,
      tracking,
      analytics,
      prisma,
      validation,
      intelligence
    );
  };

  const runConversation = async (inputs: string[], sessionId: string) => {
    const chatService = getEngine();
    const responses = [];
    const steps = [];
    for (const input of inputs) {
      const res = await chatService.sendMessage(input, sessionId);
      responses.push(res.response);
      const state = await chatService.getOrCreateSession(sessionId);
      steps.push(state.step);
    }
    return { responses, steps };
  };

  it('should run Lost Mobile complaint registration workflow identically with SAE/CIE disabled', async () => {
    // Disable flags
    process.env.ENABLE_SAE = 'false';
    process.env.ENABLE_CIE = 'false';

    const inputs = [
      "english",
      "File Complaint",
      "Manoj Tiwari",
      "7878787878",
      "Ayodhya",
      "Confirm",
      "House No 22 Civil Lines",
      "Confirm Details",
      "Lost Mobile",
      "Samsung",
      "M34",
      "Black",
      "2023",
      "Skip",
      "Ayodhya",
      "10/06/2026",
      "Lost mobile phone near temple",
      "Submit Application"
    ];

    const sessionId = `test-compat-mobile-${Date.now()}`;
    const result = await runConversation(inputs, sessionId);

    // Assert successful completion and reference number generation
    const lastResp = result.responses[result.responses.length - 1];
    expect(lastResp).toContain("UP-CMP-");
  }, 45000);

  it('should run Tenant Verification workflow identically with SAE/CIE disabled', async () => {
    process.env.ENABLE_SAE = 'false';
    process.env.ENABLE_CIE = 'false';

    const inputs = [
      "english",
      "Tenant Verification",
      "Manoj Tiwari",
      "7878787878",
      "Ayodhya",
      "Confirm",
      "House No 22 Civil Lines",
      "Confirm Details",
      "Tenant Verification",
      "Rahul Kumar",
      "Delhi",
      "9999999999",
      "Flat 101, Ayodhya",
      "Submit Application"
    ];

    const sessionId = `test-compat-tenant-${Date.now()}`;
    const result = await runConversation(inputs, sessionId);

    const lastResp = result.responses[result.responses.length - 1];
    expect(lastResp).toContain("UP-TV-");
  }, 45000);

  it('should run Character Certificate workflow identically with SAE/CIE disabled', async () => {
    process.env.ENABLE_SAE = 'false';
    process.env.ENABLE_CIE = 'false';

    const inputs = [
      "english",
      "Character Certificate",
      "Manoj Tiwari",
      "7878787878",
      "Ayodhya",
      "Confirm",
      "House No 22 Civil Lines",
      "Confirm Details",
      "Apply For Someone Else",
      "Manoj Tiwari",
      "House No 22",
      "Ayodhya",
      "Job Application",
      "Submit Application"
    ];

    const sessionId = `test-compat-cert-${Date.now()}`;
    const result = await runConversation(inputs, sessionId);

    const lastResp = result.responses[result.responses.length - 1];
    expect(lastResp).toContain("UP-CC-");
  }, 45000);

  it('should run Event Permission workflow identically with SAE/CIE disabled', async () => {
    process.env.ENABLE_SAE = 'false';
    process.env.ENABLE_CIE = 'false';

    const inputs = [
      "english",
      "Event Permission",
      "Manoj Tiwari",
      "7878787878",
      "Ayodhya",
      "Confirm",
      "House No 22 Civil Lines",
      "Confirm Details",
      "Event Permission",
      "Apply For Someone Else",
      "Manoj Tiwari",
      "House No 22 Civil Lines",
      "7878787878",
      "Diwali Mela",
      "Ram Katha Park",
      "25/10/2026",
      "1000",
      "Submit Application"
    ];

    const sessionId = `test-compat-event-${Date.now()}`;
    const result = await runConversation(inputs, sessionId);

    const lastResp = result.responses[result.responses.length - 1];
    expect(lastResp).toContain("UP-EP-");
  }, 45000);
});
