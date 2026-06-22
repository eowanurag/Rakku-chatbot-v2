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

describe('Returning Citizen Workflow Resume Spec', () => {
  let prisma: PrismaService;
  let chatService: ChatService;
  const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

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

    // Seed existing citizen
    const citizen = await prisma.citizen.create({
      data: {
        fullName: 'Ramesh Sharma',
        mobileNumber: mobile,
        city: 'Lucknow',
        district: 'LUCKNOW',
        addressLine1: 'Hazratganj Lucknow',
        isConfirmed: true,
      },
    });

    // Seed active session
    await prisma.workflowSession.create({
      data: {
        id: `sess-resume-wf-${mobile}`,
        citizenId: citizen.id,
        isCompleted: false,
        currentStep: '2_brand',
        serviceType: 'complaint',
        stateJson: JSON.stringify({
          workflow: 'complaint',
          step: '2_brand',
          citizen: { fullName: 'Ramesh Sharma', mobileNumber: mobile, city: 'Lucknow', district: 'LUCKNOW', addressLine1: 'Hazratganj Lucknow', isConfirmed: true }
        }),
      },
    });
  });

  afterAll(async () => {
    await prisma.workflowSession.deleteMany({
      where: { id: `sess-resume-wf-${mobile}` },
    }).catch(() => {});
    await prisma.citizen.deleteMany({
      where: { mobileNumber: mobile },
    }).catch(() => {});
    await prisma.$disconnect();
  });

  it('should restore state and resume active workflow details collection', async () => {
    const sessionId = `resume-wf-sess-${Date.now()}`;
    process.env.ENABLE_SAE = 'false';

    await chatService.sendMessage('English', sessionId);
    await chatService.sendMessage('File Complaint', sessionId);
    
    // User sends mobile
    const resLookup = await chatService.sendMessage(mobile, sessionId);
    expect(resLookup.response).toContain('Active Workflow');

    // Choose to continue
    const resResume = await chatService.sendMessage('Continue Previous Application', sessionId);
    expect(resResume.response).toContain('Previous application restored');

    // State should now be at step 2_model
    const state = await chatService.getOrCreateSession(sessionId);
    expect(state.step).toBe('2_model');
    expect(state.workflow).toBe('complaint');
  });
});
