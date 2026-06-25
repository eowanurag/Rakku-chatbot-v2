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

describe('Legacy Sync Spec', () => {
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

  it('should sync bidirectionally: legacy lostItemContents = "Documents" and secondaryRecommendations to incidentItems and back again', async () => {
    const sessionState: any = {
      sessionId: 'test-legacy-sync-session',
      workflow: 'complaint',
      step: 'REVIEW',
      language: 'en',
      citizen: {
        id: 'test-citizen-id',
        fullName: 'John Doe',
        mobileNumber: '9876543210',
        city: 'Lucknow',
        district: 'LUCKNOW',
        isConfirmed: true
      },
      data: {
        lostItemContents: 'Documents',
        entities: {}
      },
      intelligence: {
        secondaryRecommendations: ['Passport Reissue Guidance']
      }
    };

    // Trigger sync legacy -> new
    (chatService as any).syncLegacyFields(sessionState);

    // Verify it migrated to incidentItems
    expect(sessionState.data.incidentItems).toBeDefined();
    expect(sessionState.data.incidentItems.length).toBeGreaterThan(0);
    
    const passportItem = sessionState.data.incidentItems.find((i: any) => i.itemCode === 'PASSPORT');
    expect(passportItem).toBeDefined();

    // Clear lostItemContents & secondaryRecommendations to test migration back from incidentItems -> legacy
    sessionState.data.lostItemContents = undefined;
    sessionState.intelligence.secondaryRecommendations = undefined;

    (chatService as any).syncLegacyFields(sessionState);

    // Verify it migrated back to legacy fields
    expect(sessionState.data.lostItemContents).toBe('Documents');
    expect(sessionState.intelligence.secondaryRecommendations).toContain('Passport Reissue Guidance');
  });
});
