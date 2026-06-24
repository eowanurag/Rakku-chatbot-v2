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

describe('Legacy Broken Session E2E', () => {
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

  it('should automatically recover a session with type = null and location = "I lost my purse" on load', async () => {
    const sess = `sess-legacy-recover-${Date.now()}`;
    const brokenState = {
      workflow: 'complaint',
      step: '3',
      data: {
        type: null,
        location: 'I lost my purse'
      },
      language: 'en',
      languageSelected: true,
      citizen: {
        fullName: 'Manoj Bajpayee',
        mobileNumber: '9999999999',
        isConfirmed: true
      }
    };

    await prisma.workflowSession.create({
      data: {
        id: sess,
        stateJson: brokenState as any,
        currentStep: '3',
        serviceType: 'complaint'
      }
    });

    // Load session state
    const state = await chatService.getOrCreateSession(sess);
    expect(state.data.type).toBe('Lost Document');
    expect(state.data.location).toBeNull();
  });
});
