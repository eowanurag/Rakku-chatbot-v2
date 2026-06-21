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

describe('Profile Resume E2E Spec', () => {
  let prisma: PrismaService;
  let chatService: ChatService;
  const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

  beforeAll(async () => {
    jest.setTimeout(90000);
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
        fullName: 'Vikram Singh',
        mobileNumber: mobile,
        city: 'Kanpur',
        district: 'KANPUR',
        addressLine1: 'Kalyanpur Kanpur',
        isConfirmed: true,
      },
    });

    // Seed draft workflows to test priority ordering:
    // We will create:
    // 1. Pending submission session (currentStep = 'CONFIRM_PROFILE')
    // 2. Active workflow session (currentStep = '2_brand')
    await prisma.workflowSession.create({
      data: {
        id: `sess-pending-${mobile}`,
        citizenId: citizen.id,
        isCompleted: false,
        currentStep: 'CONFIRM_PROFILE',
        serviceType: 'complaint',
        stateJson: JSON.stringify({
          workflow: 'complaint',
          step: 'CONFIRM_PROFILE',
          citizen: { fullName: 'Vikram Singh', mobileNumber: mobile, city: 'Kanpur', district: 'KANPUR', addressLine1: 'Kalyanpur Kanpur', isConfirmed: true }
        }),
      },
    });

    await prisma.workflowSession.create({
      data: {
        id: `sess-active-${mobile}`,
        citizenId: citizen.id,
        isCompleted: false,
        currentStep: '2_brand',
        serviceType: 'complaint',
        stateJson: JSON.stringify({
          workflow: 'complaint',
          step: '2_brand',
          citizen: { fullName: 'Vikram Singh', mobileNumber: mobile, city: 'Kanpur', district: 'KANPUR', addressLine1: 'Kalyanpur Kanpur', isConfirmed: true }
        }),
      },
    });
  });

  afterAll(async () => {
    await prisma.workflowSession.deleteMany({
      where: { id: { in: [`sess-pending-${mobile}`, `sess-active-${mobile}`] } },
    }).catch(() => {});
    await prisma.citizen.deleteMany({
      where: { mobileNumber: mobile },
    }).catch(() => {});
    await prisma.$disconnect();
  });

  it('should prioritize Active Workflow over Pending Submission', async () => {
    const sess = `sess-resume-${Date.now()}`;
    process.env.ENABLE_SAE = 'false';

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    
    // Send mobile number
    const res = await chatService.sendMessage(mobile, sess);
    
    // Check that it offers to resume the Active Workflow session, which is priority 1
    expect(res.response).toContain('Active Workflow');
    expect(res.response).toContain('Would you like to continue?');

    // Confirm resume choice
    const resumeRes = await chatService.sendMessage('Continue Previous Application', sess);
    expect(resumeRes.response).toContain('Previous application restored');

    // Session step is restored and progressed to the next sub-step (2_model)
    const state = await chatService.getOrCreateSession(sess);
    expect(state.step).toBe('2_model');
    expect(state.workflow).toBe('complaint');
  }, 45000);
});
