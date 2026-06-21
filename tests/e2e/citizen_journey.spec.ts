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

describe('E2E Citizen Journey Workflow Spec', () => {
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

  const runJourney = async (inputs: string[], sessionId: string) => {
    const chatService = getEngine();
    const responses = [];
    for (const input of inputs) {
      const res = await chatService.sendMessage(input, sessionId);
      responses.push(res.response);
    }
    return responses;
  };

  it('should successfully complete a full citizen journey for Lost Mobile complaint', async () => {
    process.env.ENABLE_SAE = 'false';
    process.env.ENABLE_CIE = 'false';

    const sessionId = `e2e-journey-mobile-${Date.now()}`;
    const dynamicMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const inputs = [
      "english",
      "File Complaint",
      dynamicMobile,
      "Manoj Tiwari",
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
      "Lost phone near temple.",
      "Submit Application"
    ];

    const responses = await runJourney(inputs, sessionId);
    const lastResp = responses[responses.length - 1];

    expect(lastResp).toContain("UP-CMP-");
  }, 45000);
});
