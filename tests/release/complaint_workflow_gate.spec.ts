import { ChatService } from '../../backend/src/chat/chat.service';
import { PrismaService } from '../../backend/src/prisma.service';
import { ValidationService } from '../../backend/src/chat/validation.service';
import { ComplaintService } from '../../backend/src/workflows/complaint/complaint.service';
import { VerificationService } from '../../backend/src/workflows/verification/verification.service';
import { CertificateService } from '../../backend/src/workflows/certificate/certificate.service';
import { EventService } from '../../backend/src/workflows/event/event.service';
import { TrackingService } from '../../backend/src/workflows/tracking/tracking.service';
import { AnalyticsService } from '../../backend/src/citizen-assistance/analytics.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { IntelligenceService } from '../../backend/src/citizen-assistance/intelligence.service';
import { throwError } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

describe('Complaint Workflow Release Gate Spec', () => {
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

  it('should verify that codebase does not contain silent Lucknow/Hazratganj defaults', () => {
    const rootDir = path.resolve(__dirname, '../..');
    const chatServicePath = path.join(rootDir, 'backend/src/chat/chat.service.ts');
    expect(fs.existsSync(chatServicePath)).toBe(true);

    const content = fs.readFileSync(chatServicePath, 'utf8');
    
    // Check that we don't have the specific silent defaults that were replaced
    expect(content).not.toContain("state.citizen.city = \"Lucknow\";\n            state.citizen.district = \"LUCKNOW\";\n            state.step = 'CONFIRM_LOCATION';");
    expect(content).not.toContain("state.citizen.city = \"Lucknow\";");
  });

  it('should verify legacy session compatibility works', async () => {
    const sess = `sess-gate-migration-${Date.now()}`;
    
    const state = await chatService.getOrCreateSession(sess);
    state.workflow = 'complaint';
    state.step = '3';
    state.data = {
      location: 'Lost Mobile / Theft',
      time: '01/01/2026',
      description: 'lost my phone'
    };
    state.citizen.fullName = 'Manoj Tiwari';
    state.citizen.mobileNumber = '9876543210';
    state.citizen.city = 'Lucknow';
    state.citizen.district = 'LUCKNOW';
    state.citizen.isConfirmed = true;

    await chatService.saveSession(sess, state);

    // Send incident location
    await chatService.sendMessage('Gomti Nagar Crossing', sess);

    const migratedState = await chatService.getOrCreateSession(sess);
    expect(migratedState.data.type).toBe('Lost Mobile / Theft');
    expect(migratedState.data.location).toBe('Gomti Nagar Crossing');
  }, 30000);

  it('should verify that incident location is optional for submission', async () => {
    const sess = `sess-gate-optional-${Date.now()}`;
    const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    await chatService.sendMessage(mobile, sess);
    await chatService.sendMessage('Manoj Tiwari', sess);
    await chatService.sendMessage('Lucknow', sess);
    await chatService.sendMessage('Confirm', sess);
    await chatService.sendMessage('Gomti Nagar, Lucknow', sess);
    await chatService.sendMessage('Confirm Details', sess);

    await chatService.sendMessage('Lost Mobile / Theft', sess);
    await chatService.sendMessage('Apple', sess);
    await chatService.sendMessage('iPhone 14', sess);
    await chatService.sendMessage('Black', sess);
    await chatService.sendMessage('2023', sess);
    await chatService.sendMessage('123456789012345', sess); // IMEI
    await chatService.sendMessage('Skip', sess); // Omit Incident Location

    // Set state location to null/undefined
    const state = await chatService.getOrCreateSession(sess);
    state.data.location = null;
    await chatService.saveSession(sess, state);

    await chatService.sendMessage('01/01/2026', sess);
    const reviewRes = await chatService.sendMessage('lost my phone', sess);
    
    expect(reviewRes.response).toContain('Ready for Submission');
    expect(reviewRes.response).toContain('✓ Required Fields Complete');

    const finalRes = await chatService.sendMessage('Submit Application', sess);
    expect(finalRes.response).toContain('submitted successfully');
  }, 30000);

  it('should verify that citizen and incident locations are decoupled', async () => {
    const sess = `sess-gate-decoupled-${Date.now()}`;
    const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    await chatService.sendMessage(mobile, sess);
    await chatService.sendMessage('Manoj Tiwari', sess);
    await chatService.sendMessage('Meerut', sess); // Citizen in Meerut
    await chatService.sendMessage('Confirm', sess);
    await chatService.sendMessage('Sadar Bazar, Meerut', sess);
    await chatService.sendMessage('Confirm Details', sess);

    await chatService.sendMessage('Lost Mobile / Theft', sess);
    await chatService.sendMessage('Apple', sess);
    await chatService.sendMessage('iPhone 14', sess);
    await chatService.sendMessage('Black', sess);
    await chatService.sendMessage('2023', sess);
    await chatService.sendMessage('123456789012345', sess); // IMEI
    await chatService.sendMessage('Hazratganj Crossing, Lucknow', sess); // Incident in Lucknow
    await chatService.sendMessage('01/01/2026', sess);
    
    const reviewRes = await chatService.sendMessage('lost my phone in Lucknow', sess);
    expect(reviewRes.response).toContain('Ready for Submission');
    expect(reviewRes.response).toContain('✓ Required Fields Complete');

    const finalRes = await chatService.sendMessage('Submit Application', sess);
    expect(finalRes.response).toContain('submitted successfully');
  }, 30000);
});
