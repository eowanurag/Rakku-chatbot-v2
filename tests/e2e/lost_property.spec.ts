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

describe('Lost Property E2E', () => {
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

  it('should map Nothing Important selection to Lost Document with propertyOnly and show notice', async () => {
    const sess = `sess-nothing-important-${Date.now()}`;
    const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    await chatService.sendMessage(mobile, sess);
    await chatService.sendMessage('Raju Shrivastav', sess);
    await chatService.sendMessage('Lucknow', sess);
    await chatService.sendMessage('Confirm', sess);
    await chatService.sendMessage('Gomti Nagar, Lucknow', sess);
    await chatService.sendMessage('Confirm Details', sess);

    await chatService.sendMessage('empty bag lost', sess);

    const res = await chatService.sendMessage('6', sess);
    expect(res.response).toContain('If no important documents, phone, money or cards were inside, you may still file a General Lost Property Report');
    expect(res.response).toContain('where the incident occurred');

    const state = await chatService.getOrCreateSession(sess);
    expect(state.data.type).toBe('Lost Document');
    expect(state.data.propertyOnly).toBe(true);
    expect(state.data.lostItemContents).toBe('Nothing Important');
  });
});
