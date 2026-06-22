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

describe('Session State Integrity Spec', () => {
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
    await prisma.citizen.deleteMany({ where: { mobileNumber: mobile } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('should populate session helper fields correctly without persisting them to schema columns', async () => {
    const sessionId = `integrity-sess-${Date.now()}`;
    process.env.ENABLE_SAE = 'false';

    await chatService.sendMessage('English', sessionId);
    await chatService.sendMessage('File Complaint', sessionId);
    
    // Send new mobile (creates new onboarding context)
    await chatService.sendMessage(mobile, sessionId);

    const state = await chatService.getOrCreateSession(sessionId);
    expect(state.preOnboardingMobile).toBe(mobile);
    expect(state.preOnboardingCompleted).toBe(true);

    // Verify session save in DB has serialized this helper field under stateJson
    const dbSession = await prisma.workflowSession.findUnique({ where: { id: sessionId } });
    expect(dbSession).toBeDefined();
    const parsedState = typeof dbSession?.stateJson === 'string' 
      ? JSON.parse(dbSession.stateJson) 
      : dbSession?.stateJson as any;
    
    expect(parsedState.preOnboardingMobile).toBe(state.preOnboardingMobile);
    expect(parsedState.preOnboardingCompleted).toBe(true);
  }, 30000);
});
