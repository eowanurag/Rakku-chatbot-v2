import { LocationResolverService } from '@backend/jurisdiction-routing/location-resolver.service';
import { MatchType } from '@backend/jurisdiction-routing/jurisdiction-routing.types';
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

describe('Manual Location Fallback E2E Spec', () => {
  let resolver: LocationResolverService;
  let prisma: PrismaService;
  let chatService: ChatService;

  beforeAll(() => {
    jest.setTimeout(45000);
    resolver = new LocationResolverService();
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

  it('should return MatchType.NONE for invalid location', () => {
    const res = resolver.resolve('xyzabcqwe');
    expect(res.districtCode).toBe('');
    expect(res.matchType).toBe(MatchType.NONE);
  });

  it('should prompt for manual entry on location resolution failure instead of defaulting to Lucknow', async () => {
    const sess = `sess-loc-fallback-${Date.now()}`;
    const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    await chatService.sendMessage('English', sess);
    await chatService.sendMessage('File Complaint', sess);
    await chatService.sendMessage(mobile, sess);
    await chatService.sendMessage('Manoj Tiwari', sess);

    // Send invalid location of short length
    const res = await chatService.sendMessage('ab', sess);
    
    // Assert that response does NOT contain location confirmation "Lucknow" or "Hazratganj"
    expect(res.response).not.toContain('Lucknow');
    expect(res.response).not.toContain('Hazratganj');
    
    // Assert that response asks for manual entry or city/district input in different way
    expect(res.response).toContain('provide that information in a different way');

    const state = await chatService.getOrCreateSession(sess);
    expect(state.step).toBe('IDENTIFY_LOCATION');
  }, 30000);
});
