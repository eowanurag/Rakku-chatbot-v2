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

describe('Mobile-First Onboarding E2E Spec', () => {
  let prisma: PrismaService;
  let chatService: ChatService;
  const mobileExisting = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  const mobileNew = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

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
    await prisma.citizen.create({
      data: {
        fullName: 'Amit Verma',
        mobileNumber: mobileExisting,
        city: 'Noida',
        district: 'GAUTAM_BUDDHA_NAGAR',
        addressLine1: 'Sector 62 Noida',
        isConfirmed: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.citizen.deleteMany({
      where: { mobileNumber: { in: [mobileExisting, mobileNew] } },
    }).catch(() => {});
    await prisma.$disconnect();
  });

  it('Scenario A: Existing Citizen Happy Path (Continue Details)', async () => {
    const sess = `sess-existing-${Date.now()}`;
    process.env.ENABLE_SAE = 'false';

    await chatService.sendMessage('English', sess);
    const r1 = await chatService.sendMessage('File Complaint', sess);
    expect(r1.response).toContain('Welcome to Rakku');

    // Enter existing mobile
    const r2 = await chatService.sendMessage(mobileExisting, sess);
    expect(r2.response).toContain('Amit Verma');
    expect(r2.response).toContain('Would you like to continue with these details?');

    // Confirm details
    const r3 = await chatService.sendMessage('Continue', sess);
    expect(r3.response).toContain('Profile verified');

    const state = await chatService.getOrCreateSession(sess);
    expect(state.citizen.isConfirmed).toBe(true);
    expect(state.citizen.fullName).toBe('Amit Verma');
    expect(state.workflow).toBe('complaint');
  }, 30000);

  it('Scenario B: Existing Citizen Update Flow (Modify District change clears address)', async () => {
    const sess = `sess-update-${Date.now()}`;
    process.env.ENABLE_SAE = 'false';

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    await chatService.sendMessage(mobileExisting, sess);

    // Choose Update Profile
    const r1 = await chatService.sendMessage('Update Profile', sess);
    expect(r1.response).toContain('Which profile detail would you like to modify');

    // Change Location (option 3)
    const r2 = await chatService.sendMessage('3', sess);
    expect(r2.response).toContain('Please enter your correct location');

    // Input new location (different district: Meerut)
    const r3 = await chatService.sendMessage('Meerut', sess);
    expect(r3.response).toContain('Amit Verma');
    expect(r3.response).toContain('Meerut');
    
    // Address must be cleared because district changed
    const state = await chatService.getOrCreateSession(sess);
    expect(state.citizen.city).toBe('Meerut');
    expect(state.citizen.district).toBe('MEERUT');
    expect(state.citizen.addressLine1).toBe(''); // cleared

    // Confirming will drop citizen to IDENTIFY_ADDRESS to collect the address for new district due to consistency mismatch
    const r4 = await chatService.sendMessage('Confirm Details', sess);
    expect(r4.response).toContain('Address Consistency Mismatch');
  }, 30000);

  it('Scenario C: Existing Citizen Different Details Flow (clears state for new profile)', async () => {
    const sess = `sess-different-${Date.now()}`;
    process.env.ENABLE_SAE = 'false';

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    await chatService.sendMessage(mobileExisting, sess);

    // Select Use Different Details
    const r1 = await chatService.sendMessage('Use Different Details', sess);
    // Should prompt for full name
    expect(r1.response).toContain('may I know your name');

    const state = await chatService.getOrCreateSession(sess);
    expect(state.citizen.fullName).toBe('');
    expect(state.citizen.mobileNumber).toBe(mobileExisting); // mobile survives
    expect(state.step).toBe('IDENTIFY_NAME');
  }, 30000);

  it('Scenario D: New Citizen Full Registration Flow', async () => {
    const sess = `sess-new-${Date.now()}`;
    process.env.ENABLE_SAE = 'false';

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    
    // Enter unregistered mobile
    const r1 = await chatService.sendMessage(mobileNew, sess);
    expect(r1.response).toContain("I couldn't find an existing profile");
    
    // Enter Name
    await chatService.sendMessage('Suresh Raina', sess);
    
    // Enter Location
    await chatService.sendMessage('Ayodhya', sess);
    
    // Confirm Location
    await chatService.sendMessage('Confirm', sess);
    
    // Enter Address
    await chatService.sendMessage('House No 45 Ram Path Ayodhya', sess);
    
    // Confirm profile details
    const r2 = await chatService.sendMessage('Confirm Details', sess);
    expect(r2.response).toContain('Citizen Profile Verified');

    const state = await chatService.getOrCreateSession(sess);
    expect(state.citizen.isConfirmed).toBe(true);
    expect(state.citizen.fullName).toBe('Suresh Raina');
    expect(state.citizen.city).toBe('Ayodhya');
    expect(state.citizen.district.toUpperCase()).toBe('AYODHYA');
  }, 30000);
});
