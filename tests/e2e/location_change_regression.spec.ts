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

describe('Location Change Regression E2E Spec', () => {
  let prisma: PrismaService;
  let chatService: ChatService;

  beforeAll(() => {
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should clear address when district is changed (Lucknow -> Kanpur)', async () => {
    const sess = `sess-loc-change-clear-${Date.now()}`;
    const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    await chatService.sendMessage(mobile, sess);
    await chatService.sendMessage('Manoj Tiwari', sess);
    await chatService.sendMessage('Lucknow', sess);
    await chatService.sendMessage('Confirm', sess);
    await chatService.sendMessage('Hazratganj Crossing Lucknow', sess); // Address sets

    // Step should be CONFIRM_PROFILE
    let state = await chatService.getOrCreateSession(sess);
    expect(state.step).toBe('CONFIRM_PROFILE');
    expect(state.citizen.city).toBe('Lucknow');
    expect(state.citizen.district).toBe('LUCKNOW');
    expect(state.citizen.addressLine1).toBe('Hazratganj Crossing Lucknow');

    // Trigger update profile -> change location
    await chatService.sendMessage('Update Profile', sess);
    await chatService.sendMessage('3', sess); // location modification input step
    
    // Enter different district "Kanpur"
    await chatService.sendMessage('Kanpur', sess);

    // Verify district changed to KANPUR and address is cleared
    state = await chatService.getOrCreateSession(sess);
    expect(state.citizen.district).toBe('KANPUR');
    expect(state.citizen.addressLine1).toBe(''); // cleared
  }, 45000);

  it('should preserve address when district remains same (Noida -> Greater Noida)', async () => {
    const sess = `sess-loc-change-preserve-${Date.now()}`;
    const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    await chatService.sendMessage(mobile, sess);
    await chatService.sendMessage('Manoj Tiwari', sess);
    await chatService.sendMessage('Noida', sess);
    await chatService.sendMessage('Confirm', sess);
    await chatService.sendMessage('Sector 62 Noida', sess); // Address sets

    // Step should be CONFIRM_PROFILE
    let state = await chatService.getOrCreateSession(sess);
    expect(state.step).toBe('CONFIRM_PROFILE');
    expect(state.citizen.city).toBe('Noida');
    expect(state.citizen.district).toBe('GAUTAM_BUDDHA_NAGAR');
    expect(state.citizen.addressLine1).toBe('Sector 62 Noida');

    // Trigger update profile -> change location
    await chatService.sendMessage('Update Profile', sess);
    await chatService.sendMessage('3', sess); // location modification input step
    
    // Enter same district alias "Greater Noida"
    await chatService.sendMessage('Greater Noida', sess);

    // Verify district remains GAUTAM_BUDDHA_NAGAR and address is preserved
    state = await chatService.getOrCreateSession(sess);
    expect(state.citizen.district).toBe('GAUTAM_BUDDHA_NAGAR');
    expect(state.citizen.addressLine1).toBe('Sector 62 Noida'); // preserved!
  }, 45000);
});
