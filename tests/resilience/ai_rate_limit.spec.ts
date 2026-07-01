import { ChatService } from '../../backend/src/chat/chat.service';
import { PrismaService } from '../../backend/src/prisma.service';
import { ValidationService } from '../../backend/src/chat/validation.service';
import { ComplaintService } from '../../backend/src/workflows/complaint/complaint.service';
import { VerificationService } from '../../backend/src/workflows/verification/verification.service';
import { CertificateService } from '../../backend/src/workflows/certificate/certificate.service';
import { EventService } from '../../backend/src/workflows/event/event.service';
import { TrackingService } from '../../backend/src/workflows/tracking/tracking.service';
import { AnalyticsService } from '../../backend/src/citizen-assistance/analytics.service';
import { IntelligenceService } from '../../backend/src/citizen-assistance/intelligence.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { throwError } from 'rxjs';

describe('Resilience - AI Rate Limit', () => {
  let prisma: PrismaService;
  let chatService: ChatService;

  beforeAll(() => {
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
    // Simulate HTTP 429 Rate Limit error
    httpService.post = () => throwError(() => ({
      response: { status: 429, data: "Rate limit exceeded" }
    })) as any;

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

  it('should continue workflow on HTTP 429 AI Rate Limit', async () => {
    const sessionId = `ratelimit_test_${Date.now()}`;
    
    // Set up onboarded session to bypass onboarding wrapper
    const state = await chatService.getOrCreateSession(sessionId);
    state.citizen.isConfirmed = true;
    state.citizen.fullName = "Test Citizen";
    state.citizen.mobileNumber = "9999999999";
    state.citizen.city = "Lucknow";
    state.citizen.district = "Lucknow";
    state.language = "en";
    state.languageSelected = true;
    state.workflow = "complaint";
    state.step = "2"; // Set step to '2' (classification step)
    await chatService.saveSession(sessionId, state);

    const response = await chatService.sendMessage("I lost my documents", sessionId);

    expect(response).toBeDefined();
    // Since it classified as Lost Document, it proceeds directly to step 3 (asking for location)
    expect(response.response).toContain("where the incident occurred"); 
    expect(response._debug?.activeEngine).toBe("FALLBACK");
  });
});
