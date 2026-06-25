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

describe('Null Type Review Guard Regression Test', () => {
  let prisma: PrismaService;
  let chatService: ChatService;

  beforeAll(() => {
    jest.setTimeout(45000);
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

  it('should recover back to step 2 and clear location if type is null while trying to enter REVIEW step', async () => {
    const sess = `sess-null-type-guard-test-${Date.now()}`;
    
    const state = await chatService.getOrCreateSession(sess);
    state.workflow = 'complaint';
    state.step = 'REVIEW'; // Directly set to REVIEW
    state.data = {
      type: null,
      location: 'Lucknow',
      time: '01/01/2026',
      description: 'Lost items description'
    };
    state.citizen.fullName = 'Jane Doe';
    state.citizen.mobileNumber = '9876543210';
    state.citizen.city = 'Lucknow';
    state.citizen.district = 'LUCKNOW';
    state.citizen.isConfirmed = true;

    await chatService.saveSession(sess, state);

    // Send a message (e.g. trying to submit/confirm)
    await chatService.sendMessage('Yes', sess);

    const updatedState = await chatService.getOrCreateSession(sess);
    
    // Assertions: it should have failed-fast and transitioned to step 2 and cleared location
    expect(updatedState.data.type).toBeNull();
    expect(updatedState.step).toBe('2');
    expect(updatedState.data.location).toBeNull(); // wait, since delete session.data.location makes it undefined/null or deleted, it should be undefined or null
  });
});
