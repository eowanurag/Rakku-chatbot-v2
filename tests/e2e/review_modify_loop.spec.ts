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

jest.setTimeout(180000);

describe('Review Modify Loop E2E', () => {
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

  it('should navigate to edit selection, accept update and return to REVIEW without description corruption', async () => {
    const sess = `sess-review-modify-${Date.now()}`;
    const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    await chatService.sendMessage(mobile, sess);
    await chatService.sendMessage('Manoj Bajpayee', sess);
    await chatService.sendMessage('Lucknow', sess);
    await chatService.sendMessage('Confirm', sess);
    await chatService.sendMessage('Gomti Nagar, Lucknow', sess);
    await chatService.sendMessage('Confirm Details', sess);

    await chatService.sendMessage('Lost Document', sess);
    await chatService.sendMessage('Yes', sess);
    await chatService.sendMessage('Varanasi Airport', sess);
    await chatService.sendMessage('12/12/2025', sess);
    const initialDesc = 'I lost my certificate here';
    await chatService.sendMessage(initialDesc, sess);

    // Now in REVIEW state
    const stateBefore = await chatService.getOrCreateSession(sess);
    expect(stateBefore.step).toBe('REVIEW');
    expect(stateBefore.data.description).toBe(initialDesc);

    // Send Modify Details
    const modRes = await chatService.sendMessage('Modify Details', sess);
    expect(modRes.response).toContain('Which detail would you like to modify');

    // Select Description
    await chatService.sendMessage('Description', sess);
    const stateDuring = await chatService.getOrCreateSession(sess);
    expect(stateDuring.step).toBe('REVIEW_EDIT_VALUE');
    expect(stateDuring.data.editingField).toBe('description');

    // Send new description
    const newDesc = 'New updated description of the event';
    const reviewRes = await chatService.sendMessage(newDesc, sess);

    const stateAfter = await chatService.getOrCreateSession(sess);
    expect(stateAfter.step).toBe('REVIEW');
    expect(stateAfter.data.description).toBe(newDesc);
    expect(stateAfter.data.editingField).toBeUndefined();
    expect(reviewRes.response).toContain('Please review your application');
  });
});
