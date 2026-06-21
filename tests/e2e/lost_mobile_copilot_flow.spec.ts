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

describe('Lost Mobile Copilot-to-Workflow E2E Integration Spec', () => {
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
    jest.setTimeout(90000);
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

  it('should process natural language میرا فون खो गया, render recommendation card, and launch complaint workflow successfully', async () => {
    // Enable copilot layers
    process.env.ENABLE_SAE = 'true';
    process.env.ENABLE_CIE = 'true';

    const chatService = getEngine();
    const sessionId = `e2e-copilot-lost-mobile-${Date.now()}`;

    // 1. Start with language selection
    const res1 = await chatService.sendMessage("english", sessionId);
    expect(res1.response).toBeDefined();

    // 2. Send natural language statement that maps directly to LOST_MOBILE via phrase dictionary
    const res2 = await chatService.sendMessage("मेरा फोन खो गया", sessionId);
    
    // The response should render the Recommendation Card for Lost Mobile / Lost Property
    expect(res2.response).toContain("Urgency");
    expect(res2.response).toContain("Complaint Registration");

    // 3. User clicks/inputs "continue" to progress into profile confirmation and complaint workflow
    const res3 = await chatService.sendMessage("continue", sessionId);
    expect(res3.response.toLowerCase()).toContain("name"); // Prompts for profile name

    // 4. Complete profile and complaint details inputs
    const dynamicMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const remainInputs = [
      dynamicMobile,
      "Manoj Tiwari",
      "Ayodhya",
      "Confirm",
      "House No 22 Civil Lines",
      "Confirm Details",
      "Samsung",
      "M34",
      "Black",
      "2023",
      "Skip",
      "Ayodhya",
      "10/06/2026",
      "Lost phone near temple.",
      "Submit Application"
    ];

    let lastResp = "";
    for (const input of remainInputs) {
      const res = await chatService.sendMessage(input, sessionId);
      lastResp = res.response;
    }

    // 5. Assert successful complaint submission with ref number generated
    expect(lastResp).toContain("UP-CMP-");
  }, 60000);
});
