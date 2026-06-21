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

describe('Returning Citizen Intent Persistence E2E Spec', () => {
  let prisma: PrismaService;
  let chatService: ChatService;
  const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

  beforeAll(async () => {
    jest.setTimeout(60000);
    prisma = new PrismaService();
    const config = new ConfigService();
    const validation = new ValidationService();
    const complaint = new ComplaintService(prisma);
    const verification = new VerificationService(prisma);
    const certificate = new CertificateService(prisma);
    const event = new EventService(prisma);
    const tracking = new TrackingService(prisma);
    const analytics = new AnalyticsService();
    const intelligence = new IntelligenceService(prisma);

    const httpService = new HttpService();
    httpService.post = () => throwError(() => new Error('Forced connection failure for testing')) as any;

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

    // Seed an existing citizen with this mobile number
    await prisma.citizen.create({
      data: {
        fullName: 'Rajesh Kumar',
        mobileNumber: mobile,
        city: 'Lucknow',
        district: 'LUCKNOW',
        addressLine1: 'Aliganj Lucknow',
        isConfirmed: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.citizen.deleteMany({ where: { mobileNumber: mobile } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('should preserve classification intent (BIKE_THEFT) for returning citizen through onboarding wrapper', async () => {
    const sessionId = `intent-persistence-sess-${Date.now()}`;
    process.env.ENABLE_SAE = 'false';

    // 1. User selects language
    await chatService.sendMessage('English', sessionId);

    // 2. User says "meri bike chori ho gayi" which triggers complaint workflow & onboarding welcome
    const response1 = await chatService.sendMessage('meri bike chori ho gayi', sessionId);
    expect(response1.response).toContain('Welcome to Rakku');
    
    // Validate that workflow intent is detected as 'complaint' and saved in pending storage
    const stateAfterIntent = await chatService.getOrCreateSession(sessionId);
    expect(stateAfterIntent.pendingWorkflowId).toBe('complaint');
    
    // 3. User sends mobile number for lookup
    const response2 = await chatService.sendMessage(mobile, sessionId);
    expect(response2.response).toContain('Rajesh Kumar');
    
    // 4. User confirms Rajesh's profile details
    const response3 = await chatService.sendMessage('Continue', sessionId);

    // The system should restore Rajesh's profile details and transition Rajesh straight to the workflow steps
    const finalState = await chatService.getOrCreateSession(sessionId);
    expect(finalState.citizen.isConfirmed).toBe(true);
    expect(finalState.citizen.fullName).toBe('Rajesh Kumar');
    
    // Active workflow remains 'complaint'
    expect(finalState.workflow).toBe('complaint');
    
    // Workflow step transitioned to complaint details collection (step 2 or sub-step 2_brand)
    expect(['2', '2_brand']).toContain(finalState.step);
  }, 45000);
});
