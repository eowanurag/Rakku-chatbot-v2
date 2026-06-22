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

describe('Mobile Lookup Edge Cases Spec', () => {
  let prisma: PrismaService;
  let chatService: ChatService;
  const corruptedMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

  beforeAll(async () => {
    jest.setTimeout(60000);
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
    httpService.post = () => throwError(() => new Error('Forced connection failure')) as any;

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

    // Seed a corrupted profile (missing fullName)
    await prisma.citizen.create({
      data: {
        fullName: '', // empty name = corrupted
        mobileNumber: corruptedMobile,
        isConfirmed: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.citizen.deleteMany({ where: { mobileNumber: corruptedMobile } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('should fall back to manual registration when profile is corrupted', async () => {
    const sessionId = `corrupt-sess-${Date.now()}`;
    process.env.ENABLE_SAE = 'false';

    await chatService.sendMessage('English', sessionId);
    await chatService.sendMessage('File Complaint', sessionId);
    
    // Send corrupted mobile
    const res = await chatService.sendMessage(corruptedMobile, sessionId);
    expect(res.response).toContain("We couldn't retrieve your profile");
    expect(res.response).toContain('may I know your name');

    const state = await chatService.getOrCreateSession(sessionId);
    expect(state.step).toBe('IDENTIFY_NAME');
  });
});
