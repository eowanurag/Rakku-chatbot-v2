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

describe('Review State Transition Guard E2E', () => {
  let chatService: ChatService;
  let prisma: PrismaService;

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

  it('should allow valid review state transitions', () => {
    // REVIEW -> REVIEW_EDIT_SELECTION
    expect(chatService.canTransition('REVIEW', 'REVIEW_EDIT_SELECTION')).toBe(true);

    // REVIEW_EDIT_SELECTION -> REVIEW_EDIT_VALUE
    expect(chatService.canTransition('REVIEW_EDIT_SELECTION', 'REVIEW_EDIT_VALUE')).toBe(true);

    // REVIEW_EDIT_VALUE -> REVIEW
    expect(chatService.canTransition('REVIEW_EDIT_VALUE', 'REVIEW')).toBe(true);
  });

  it('should reject invalid transitions', () => {
    // REVIEW_EDIT_VALUE -> ASK_FEEDBACK is direct submission without review
    expect(chatService.canTransition('REVIEW_EDIT_VALUE', 'ASK_FEEDBACK')).toBe(false);

    // REVIEW_EDIT_VALUE -> START
    expect(chatService.canTransition('REVIEW_EDIT_VALUE', 'START')).toBe(false);
  });
});
