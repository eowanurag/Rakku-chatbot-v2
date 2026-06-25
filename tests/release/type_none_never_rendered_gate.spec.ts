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

describe('Release Gate - type_none_never_rendered_gate', () => {
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

  it('should verify that None/null/undefined complaint type never appears in REVIEW', async () => {
    const sess = `sess-none-gate-${Date.now()}`;
    const state = await chatService.getOrCreateSession(sess);
    state.workflow = 'complaint';
    state.step = 'REVIEW';
    state.citizen.fullName = 'John Doe';
    state.citizen.mobileNumber = '9876543210';
    state.citizen.city = 'Lucknow';
    state.citizen.district = 'LUCKNOW';
    state.citizen.isConfirmed = true;
    state.data = {
      location: 'Noida Sector 62',
      time: '15/07/2026',
      description: 'Lost wallet containing documents',
      incidentItems: []
    };
    
    // Explicitly set type to null or undefined to trigger safety guards
    state.data.type = undefined;

    await chatService.saveSession(sess, state);

    // Sending any message should trigger safety guards and recovery instead of rendering REVIEW with null type
    const res = await chatService.sendMessage('confirm', sess);

    const updatedState = await chatService.getOrCreateSession(sess);

    // The state should have recovered and redirected from REVIEW because type was missing
    expect(updatedState.step).not.toBe('REVIEW');
    expect(res.response).not.toContain('Type: undefined');
    expect(res.response).not.toContain('Type: null');
    expect(res.response).not.toContain('Type: None');
    expect(res.response).not.toContain('Complaint Type: None');
  });
});
