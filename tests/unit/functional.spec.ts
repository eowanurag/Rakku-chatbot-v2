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

jest.setTimeout(60000);

describe('Functional Workflows (Comprehensive)', () => {
  let chatService: ChatService;
  let prisma: PrismaService;
  let validation: ValidationService;

  beforeAll(() => {
    prisma = new PrismaService();
    const config = new ConfigService();
    validation = new ValidationService();
    const complaint = new ComplaintService(prisma);
    const verification = new VerificationService(prisma);
    const certificate = new CertificateService(prisma);
    const event = new EventService(prisma);
    const tracking = new TrackingService(prisma);
    const intelligence = new IntelligenceService(prisma);
    const analytics = new AnalyticsService();
    
    const httpService = new HttpService();
    // Default to mock failure to trigger local fallback for functional testing
    httpService.post = () => throwError(() => new Error('Forced connection failure')) as any;

    chatService = new ChatService(
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('TS-1: Citizen Profile Flow', async () => {
    const sess = "sess-suite-1-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess);
    await chatService.sendMessage("english", sess);
    await chatService.sendMessage("File Complaint", sess);
    await chatService.sendMessage("9999000099", sess);
    await chatService.sendMessage("Raj", sess);
    await chatService.sendMessage("Lucknow", sess);
    await chatService.sendMessage("Confirm", sess);
    await chatService.sendMessage("Sector 7, Gomti Nagar, Lucknow - 226002", sess);
    await chatService.sendMessage("yes", sess);

    const citizen = await prisma.citizen.findFirst({
      where: { mobileNumber: "9999000099" },
      orderBy: { createdAt: 'desc' }
    });
    expect(citizen).toBeDefined();
    expect(citizen?.fullName).toBe("Raj");
  });

  it('TS-2: Hindi Name Validation', async () => {
    const sess = "sess-suite-2-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess);
    await chatService.sendMessage("english", sess);
    await chatService.sendMessage("Tenant Verification", sess);
    const hindiNameRes = await chatService.sendMessage("राज", sess);

    const validHindi = validation.validateName("राज");
    expect(validHindi).toBe(true);
    expect(hindiNameRes.response).not.toContain("I may not have understood correctly");
  });

  it('TS-3: Hindi Full Name Validation', async () => {
    const sess = "sess-suite-3-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess);
    await chatService.sendMessage("english", sess);
    await chatService.sendMessage("Tenant Verification", sess);
    const hindiFullNameRes = await chatService.sendMessage("मोहन सिंह", sess);

    expect(hindiFullNameRes.response).not.toContain("I may not have understood correctly");
    expect(hindiFullNameRes.response).not.toContain("Example");
  });

  it('TS-4: Hinglish Intent Detection', async () => {
    const sess = "sess-suite-4-" + Math.random().toString(36).substring(7);
    await chatService.sendMessage("hello", sess);
    await chatService.sendMessage("english", sess);
    await chatService.sendMessage("Phone chori ho gaya", sess);
    const state = await chatService.getOrCreateSession(sess);

    expect(state.workflow).toBe("complaint");
  });

  // More test suites to be added here as needed...
});
