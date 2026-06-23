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

describe('Emergency Fast Path & Resume Spec', () => {
  let prisma: PrismaService;
  let chatService: ChatService;

  beforeAll(async () => {
    jest.setTimeout(45000);
    process.env.ENABLE_SAE = 'false';
    process.env.ENABLE_CIE = 'false';
    prisma = new PrismaService();
    await prisma.$connect();
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
    if (chatService && chatService['checkpointService']) {
      chatService['checkpointService'].onModuleDestroy();
    }
    await prisma.$disconnect();
  });

  it('should trigger emergency confirmation prompt, and resume state on Yes', async () => {
    const sess = `sess-emerg-yes-${Date.now()}`;
    const mobile = `9${String(Date.now()).substring(4)}`;

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    await chatService.sendMessage(mobile, sess);
    await chatService.sendMessage('Ramesh Kumar', sess);
    await chatService.sendMessage('Lucknow', sess);
    await chatService.sendMessage('Confirm', sess);
    await chatService.sendMessage('Aliganj, Lucknow', sess);
    await chatService.sendMessage('Confirm Details', sess);

    // Now in complaint selection step
    const midState = await chatService.getOrCreateSession(sess);
    expect(midState.workflow).toBe('complaint');

    // Trigger emergency keyword
    const emergencyRes = await chatService.sendMessage('Help, someone is attacking me right now!', sess);
    expect(emergencyRes.response).toContain('112'); // Emergency helpline
    expect(emergencyRes.response).toContain('wish to file'); // Confirmation question

    // State should be EMERGENCY_CONFIRM
    const emergencyState = await chatService.getOrCreateSession(sess);
    expect(emergencyState.step).toBe('EMERGENCY_CONFIRM');

    // Reply 'Yes' to resume previous state
    const resumeRes = await chatService.sendMessage('Yes', sess);
    expect(resumeRes.response).toContain('Continuing with your request');

    // Check that state has been restored
    const restoredState = await chatService.getOrCreateSession(sess);
    expect(restoredState.workflow).toBe('complaint');
    expect(restoredState.step).not.toBe('EMERGENCY_CONFIRM');
  }, 30000);

  it('should trigger emergency confirmation prompt, and cancel state on No', async () => {
    const sess = `sess-emerg-no-${Date.now()}`;
    const mobile = `9${String(Date.now()).substring(4)}`;

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    await chatService.sendMessage(mobile, sess);
    await chatService.sendMessage('Ramesh Kumar', sess);
    await chatService.sendMessage('Lucknow', sess);
    await chatService.sendMessage('Confirm', sess);
    await chatService.sendMessage('Aliganj, Lucknow', sess);
    await chatService.sendMessage('Confirm Details', sess);

    // Trigger emergency keyword
    await chatService.sendMessage('Help, there is an ongoing attack!', sess);

    // Reply 'No' to cancel complaint filing
    const cancelRes = await chatService.sendMessage('No', sess);
    expect(cancelRes.response).toContain('cancelled the complaint filing');

    const cancelledState = await chatService.getOrCreateSession(sess);
    expect(cancelledState.workflow).toBeNull();
    expect(cancelledState.step).toBe('START');
  }, 30000);
});
