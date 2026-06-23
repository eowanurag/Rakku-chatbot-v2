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

describe('Legacy Complaint Session Migration Spec', () => {
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

  it('should automatically migrate legacy location to type', async () => {
    const sess = `sess-legacy-migration-${Date.now()}`;
    
    const state = await chatService.getOrCreateSession(sess);
    state.workflow = 'complaint';
    state.step = '3';
    state.data = {
      location: 'Lost Mobile / Theft',
      time: '01/01/2026',
      description: 'lost my phone'
    };
    state.citizen.fullName = 'Manoj Tiwari';
    state.citizen.mobileNumber = '9876543210';
    state.citizen.city = 'Lucknow';
    state.citizen.district = 'LUCKNOW';
    state.citizen.isConfirmed = true;

    await chatService.saveSession(sess, state);

    // Sending incident location Gomti Nagar Crossing
    await chatService.sendMessage('Gomti Nagar Crossing', sess);

    const migratedState = await chatService.getOrCreateSession(sess);
    expect(migratedState.data.type).toBe('Lost Mobile / Theft');
    expect(migratedState.data.location).toBe('Gomti Nagar Crossing');
  }, 30000);
});
