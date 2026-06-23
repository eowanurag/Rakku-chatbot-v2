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

describe('Checkpoint Recovery E2E Spec', () => {
  let prisma: PrismaService;
  let chatService: ChatService;
  const mobile = `9${String(Date.now()).substring(4)}`;
  const resumeSessionId = `sess-resume-chk-${mobile}`;

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

    // Seed existing citizen
    const citizen = await prisma.citizen.create({
      data: {
        fullName: 'Devendra Mishra',
        mobileNumber: mobile,
        city: 'Lucknow',
        district: 'LUCKNOW',
        addressLine1: 'Aliganj Lucknow',
        isConfirmed: true,
      },
    });

    // Seed session with complete resumeInformation snapshot
    await prisma.workflowSession.create({
      data: {
        id: resumeSessionId,
        citizenId: citizen.id,
        isCompleted: false,
        currentStep: '2_model',
        serviceType: 'complaint',
        stateJson: JSON.stringify({
          workflow: 'complaint',
          step: '2_model',
          citizen: { fullName: 'Devendra Mishra', mobileNumber: mobile, city: 'Lucknow', district: 'LUCKNOW', addressLine1: 'Aliganj Lucknow', isConfirmed: true },
          resumeInformation: {
            workflowId: 'complaint',
            step: '2_model',
            dataSnapshot: { type: 'Lost Mobile / Theft', brand: 'Apple' },
            lastUpdatedAt: new Date().toISOString()
          }
        }),
      },
    });
  });

  afterAll(async () => {
    if (chatService && chatService['checkpointService']) {
      chatService['checkpointService'].onModuleDestroy();
    }
    await prisma.workflowSession.deleteMany({
      where: { id: resumeSessionId },
    }).catch(() => {});
    await prisma.citizen.deleteMany({
      where: { mobileNumber: mobile },
    }).catch(() => {});
    await prisma.$disconnect();
  });

  it('should deterministically recover state and dataSnapshot from resumeInformation', async () => {
    const sess = `sess-usr-${Date.now()}`;
    process.env.ENABLE_SAE = 'false';

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    
    // Provide mobile number, which matches seeded citizen & finds the active workflow session
    const res = await chatService.sendMessage(mobile, sess);
    expect(res.response).toContain('Active Workflow');

    // Choose to resume
    const resumeRes = await chatService.sendMessage('Continue Previous Application', sess);
    expect(resumeRes.response).toContain('restored');

    // Assert state contains recovered dataSnapshot and step
    const state = await chatService.getOrCreateSession(sess);
    expect(state.workflow).toBe('complaint');
    expect(state.step).toBe('2_color'); // advanced from 2_model to 2_color
    expect(state.data.brand).toBe('Apple');
    expect(state.data.type).toBe('Lost Mobile / Theft');
  }, 30000);
});
