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

describe('Location Default Regression Spec', () => {
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

  it('should resolve via GPS if coordinates are present', async () => {
    const sess = `sess-gps-${Date.now()}`;
    const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    const station = await prisma.policeStation.findFirst({ where: { isActive: true } });
    if (!station || !station.latitude || !station.longitude) {
      console.warn('No active station with coordinates found. Skipping GPS E2E check.');
      return;
    }

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    await chatService.sendMessage(mobile, sess);

    const res = await chatService.sendMessage('Manoj Tiwari', sess, station.latitude, station.longitude);
    expect(res.response).toContain('I found your location');
    expect(res.response).toContain(station.districtCode);
    expect(res.response).not.toContain('❌ Unable to determine');
  }, 30000);

  it('should resolve via profile location if profile exists', async () => {
    const sess = `sess-profile-${Date.now()}`;
    const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    await chatService.sendMessage(mobile, sess);

    const state = await chatService.getOrCreateSession(sess);
    state.citizen.city = 'Kanpur';
    state.citizen.district = 'KANPUR';
    await chatService.saveSession(sess, state);

    const res = await chatService.sendMessage('Manoj Tiwari', sess);
    expect(res.response).toContain('I found your location');
    expect(res.response).toContain('Kanpur');
  }, 30000);

  it('should fall back to manual entry prompt when GPS, Profile and IP are unavailable', async () => {
    const sess = `sess-fallback-${Date.now()}`;
    const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    await chatService.sendMessage(mobile, sess);

    const res = await chatService.sendMessage('Manoj Tiwari', sess);
    expect(res.response).toContain('Unable to determine your current location automatically');
    expect(res.response).not.toContain('Lucknow');
    expect(res.response).not.toContain('Hazratganj');
  }, 30000);
});
