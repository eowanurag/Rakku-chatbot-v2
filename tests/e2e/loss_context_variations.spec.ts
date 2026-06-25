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

describe('Loss Context Variations E2E Spec', () => {
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

    // Mock assess to inject the container entity during the assessment phase
    const originalAssess = chatService['situationAssessmentService'].assess;
    chatService['situationAssessmentService'].assess = async (msg: string, session: any) => {
      const res = await originalAssess.call(chatService['situationAssessmentService'], msg, session);
      if (msg === 'gum ho gaya') {
        session.intelligence = {
          entities: {
            container: 'bag'
          },
          clarificationRequired: false,
          completeness: 'INCOMPLETE',
          confidence: null,
          riskCategory: null,
          severity: null,
          recommendations: []
        };
      }
      return res;
    };
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const cases = [
    "can't find my purse",
    "my bag is missing",
    "wallet got stolen",
    "gum ho gaya",
    "kho gaya mera batua",
    "left my bag in taxi"
  ];

  for (const utterance of cases) {
    it(`should successfully trigger container clarification workflow for: "${utterance}"`, async () => {
      const sess = `sess-lossvar-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const state = await chatService.getOrCreateSession(sess);
      state.workflow = 'complaint';
      state.step = '2';
      state.citizen.fullName = 'Jane Doe';
      state.citizen.mobileNumber = '9876543210';
      state.citizen.city = 'Lucknow';
      state.citizen.district = 'LUCKNOW';
      state.citizen.isConfirmed = true;

      await chatService.saveSession(sess, state);

      await chatService.sendMessage(utterance, sess);

      const updatedState = await chatService.getOrCreateSession(sess);

      // It must transition to container clarification
      expect(updatedState.step).toBe('COMPLAINT_LOST_ITEM_CLARIFICATION');
      expect(updatedState.pendingComplaintType).toBe('AMBIGUOUS_CONTAINER_INCIDENT');
    });
  }
});
