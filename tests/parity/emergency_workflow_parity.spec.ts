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

describe('Emergency Workflow Localization Parity Tests', () => {
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
    const intelligence = new IntelligenceService(prisma);
    const analytics = new AnalyticsService();

    const httpService = new HttpService();
    // Force connection failure to trigger handleLocalFallback in testing
    httpService.post = () => throwError(() => new Error('Forced AI connection failure for testing')) as any;

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

  it('should trigger emergency override warning for English, Hindi, and Hinglish queries', async () => {
    const englishSession = 'emergency-en-' + Math.random().toString(36).substring(7);
    const hindiSession = 'emergency-hi-' + Math.random().toString(36).substring(7);
    const hinglishSession = 'emergency-hinglish-' + Math.random().toString(36).substring(7);

    // 1. English Trigger
    const resEn = await chatService.sendMessage("Emergency Contacts", englishSession);
    expect(resEn.response).toContain("112");
    expect(resEn.response).toContain("emergency");

    // 2. Hindi Trigger
    // First set language to Hindi in the session
    await chatService.sendMessage("हिंदी", hindiSession);
    const resHi = await chatService.sendMessage("🆘 आपातकालीन सहायता", hindiSession);
    expect(resHi.response).toContain("112");
    expect(resHi.response).toContain("आपातकालीन");

    // 3. Hinglish Trigger
    // First set language to Hinglish
    await chatService.sendMessage("Hinglish", hinglishSession);
    const resHinglish = await chatService.sendMessage("Emergency Contacts", hinglishSession);
    expect(resHinglish.response).toContain("112");
    expect(resHinglish.response).toContain("emergency");
  });
});
