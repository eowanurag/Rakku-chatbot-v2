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

describe('Corrupted Session Recovery E2E', () => {
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

  it('should automatically clear system action strings saved in data or citizen fields on session load', async () => {
    const sess = `sess-corrupted-${Date.now()}`;
    const corruptedState = {
      workflow: 'complaint',
      step: '5',
      data: {
        type: 'Modify Details',
        location: 'Lucknow',
        time: '12/12/2025',
        description: 'Confirm Details'
      },
      language: 'en',
      languageSelected: true,
      citizen: {
        fullName: 'Cancel',
        mobileNumber: '9999999999',
        isConfirmed: true
      }
    };

    await prisma.workflowSession.create({
      data: {
        id: sess,
        stateJson: corruptedState as any,
        currentStep: '5',
        serviceType: 'complaint'
      }
    });

    const state = await chatService.getOrCreateSession(sess);
    expect(state.data.type).toBeNull();
    expect(state.data.description).toBeNull();
    expect(state.data.location).toBe('Lucknow');
    expect(state.citizen.fullName).toBe('');
  });
});
