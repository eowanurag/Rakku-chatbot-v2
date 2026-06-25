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

describe('Location and Description Preservation E2E Spec', () => {
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

  it('should preserve valid location and description through refresh and recovery', async () => {
    const sess = `sess-preserve-${Date.now()}`;
    const state = await chatService.getOrCreateSession(sess);
    state.workflow = 'complaint';
    state.step = 'REVIEW';
    state.citizen.fullName = 'Jane Doe';
    state.citizen.mobileNumber = '9876543210';
    state.citizen.city = 'Lucknow';
    state.citizen.district = 'LUCKNOW';
    state.citizen.isConfirmed = true;
    
    // Set valid location, valid description, but null type to trigger recovery
    state.data = {
      location: 'Hazratganj Crossings',
      description: 'Lost my pink purse containing ATM card and phone',
      time: '24/06/2026',
      incidentItems: []
    };
    state.data.type = undefined;

    await chatService.saveSession(sess, state);

    // Call sendMessage or load which triggers runComplaintWorkflow -> recoverComplaintType
    await chatService.sendMessage('help', sess);

    const recoveredState = await chatService.getOrCreateSession(sess);

    // Location and Description must be preserved because they are not corrupted
    expect(recoveredState.data.location).toBe('Hazratganj Crossings');
    expect(recoveredState.data.description).toBe('Lost my pink purse containing ATM card and phone');
    expect(recoveredState.step).toBe('COMPLAINT_LOST_ITEM_CLARIFICATION'); // since incidentItems is empty and pending type is container
  });
});
