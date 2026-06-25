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

describe('Ambiguous Session Recovery E2E', () => {
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

  it('should recover state to COMPLAINT_LOST_ITEM_CLARIFICATION when pendingComplaintType is AMBIGUOUS_LOST_ITEM', async () => {
    const sess = `sess-recovery-ambig-${Date.now()}`;

    // Create session in DB or cache with ambiguous pending state
    const state = await chatService.getOrCreateSession(sess);
    state.workflow = 'complaint';
    state.pendingComplaintType = 'AMBIGUOUS_LOST_ITEM';
    state.step = '2';
    state.citizen.isConfirmed = true;

    await chatService.saveSession(sess, state);

    // Now reload session (which calls migrateAndRecoverSession)
    const reloaded = await chatService.getOrCreateSession(sess);
    expect(reloaded.step).toBe('COMPLAINT_LOST_ITEM_CLARIFICATION');
    expect(reloaded.pendingComplaintType).toBe('AMBIGUOUS_LOST_ITEM');
  });
});
