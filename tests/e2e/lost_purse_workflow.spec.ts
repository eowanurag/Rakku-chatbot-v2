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

describe('E2E - Lost Purse Workflow', () => {
  let prisma: PrismaService;
  let chatService: ChatService;

  beforeAll(() => {
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should transition to CLARIFICATION when purse is lost', async () => {
    const sess = `sess-lost-purse-test-${Date.now()}`;
    const state = await chatService.getOrCreateSession(sess);
    state.workflow = 'complaint';
    state.step = '2';
    state.citizen.fullName = 'Jane Doe';
    state.citizen.mobileNumber = '9876543210';
    state.citizen.city = 'Lucknow';
    state.citizen.district = 'LUCKNOW';
    state.citizen.isConfirmed = true;

    await chatService.saveSession(sess, state);
    await chatService.sendMessage('I lost my purse', sess);

    const updatedState = await chatService.getOrCreateSession(sess);
    expect(updatedState.step).toBe('COMPLAINT_LOST_ITEM_CLARIFICATION');
  });
});
