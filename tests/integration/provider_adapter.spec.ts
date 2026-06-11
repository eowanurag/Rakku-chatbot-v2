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
import { throwError, of } from 'rxjs';

describe('AI Provider Adapter Test', () => {
  let prisma: PrismaService;

  beforeAll(() => {
    prisma = new PrismaService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should fallback to NestJS logic gracefully if FastAPI service is unavailable', async () => {
    const config = new ConfigService();
    const validation = new ValidationService();
    const complaint = new ComplaintService(prisma);
    const verification = new VerificationService(prisma);
    const certificate = new CertificateService(prisma);
    const event = new EventService(prisma);
    const tracking = new TrackingService(prisma);
    const intelligence = new IntelligenceService(prisma);
    const analytics = new AnalyticsService();
    
    const httpService = new HttpService();
    // Simulate FastAPI being down
    httpService.post = () => throwError(() => new Error('Connection refused')) as any;

    const chatService = new ChatService(
      httpService, config, complaint, verification, certificate, event, tracking, analytics, prisma, validation, intelligence
    );

    const sess = "fallback-test-" + Math.random().toString(36).substring(7);
    const response = await chatService.sendMessage("hello", sess);

    // Should return greeting from local message library fallback
    expect(response.response).toContain("👮");
  });

  it('should maintain consistent conversation state regardless of AI provider', async () => {
    const config = new ConfigService();
    const validation = new ValidationService();
    const complaint = new ComplaintService(prisma);
    const verification = new VerificationService(prisma);
    const certificate = new CertificateService(prisma);
    const event = new EventService(prisma);
    const tracking = new TrackingService(prisma);
    const intelligence = new IntelligenceService(prisma);
    const analytics = new AnalyticsService();
    
    const httpService = new HttpService();
    // Simulate FastAPI being up
    httpService.post = jest.fn().mockImplementation(() => {
      return of({
        data: {
          response: "This is a response from the FastAPI Python engine.",
          extracted_entities: { intent: "complaint" }
        }
      });
    }) as any;

    const chatService = new ChatService(
      httpService, config, complaint, verification, certificate, event, tracking, analytics, prisma, validation, intelligence
    );

    const sess = "provider-state-test-" + Math.random().toString(36).substring(7);
    const response = await chatService.sendMessage("I want to file a complaint", sess);

    // It should have called FastAPI
    expect(httpService.post).toHaveBeenCalled();
    expect(response.response).toBe("This is a response from the FastAPI Python engine.");
  });
});
