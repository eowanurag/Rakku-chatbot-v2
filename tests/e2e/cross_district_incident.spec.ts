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

describe('Cross District Incident E2E Spec', () => {
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

  it('should allow a citizen of Meerut to submit a complaint for an incident in Lucknow', async () => {
    const sess = `sess-cross-${Date.now()}`;
    const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    await chatService.sendMessage(mobile, sess);
    await chatService.sendMessage('Manoj Tiwari', sess);
    await chatService.sendMessage('Meerut', sess);
    await chatService.sendMessage('Confirm', sess);
    await chatService.sendMessage('Sadar Bazar, Meerut', sess);
    await chatService.sendMessage('Confirm Details', sess);

    // Complaint flow steps
    await chatService.sendMessage('Lost Mobile / Theft', sess);
    await chatService.sendMessage('Apple', sess);
    await chatService.sendMessage('iPhone 14', sess);
    await chatService.sendMessage('Black', sess);
    await chatService.sendMessage('2023', sess);
    await chatService.sendMessage('123456789012345', sess); // IMEI
    await chatService.sendMessage('Hazratganj Crossing, Lucknow', sess); // Incident Location in Lucknow
    await chatService.sendMessage('01/01/2026', sess); // Incident Date
    
    // Description - contains "Lucknow" (different from Meerut)
    const reviewRes = await chatService.sendMessage('lost my phone in Lucknow', sess);
    expect(reviewRes.response).toContain('Ready for Submission');
    expect(reviewRes.response).toContain('✓ Required Fields Complete');

    // Submit
    const finalRes = await chatService.sendMessage('Submit Application', sess);
    expect(finalRes.response).toContain('submitted successfully');
  }, 30000);
});
